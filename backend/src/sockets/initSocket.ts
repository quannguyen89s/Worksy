import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { getCorsOptions } from "../config/corsOptions";
import { setIo } from "./io.registry";
import jobModel from "../models/job.model";
import chatMessageModel from "../models/chatMessage.model";

export function initSocket(httpServer: HttpServer) {
  const cors = getCorsOptions();
  const io = new Server(httpServer, {
    cors: {
      origin: cors.origin ?? true,
      credentials: cors.credentials === true,
    },
  });
  setIo(io);

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth as { token?: string })?.token ??
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : null);
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const secret = process.env.JWT_SECRET_ACCESS_TOKEN;
      if (!secret) return next(new Error("Server misconfiguration"));
      const decoded = jwt.verify(token, secret) as { _id?: string; sub?: string };
      const id = decoded._id ?? decoded.sub;
      if (!id) return next(new Error("Unauthorized"));
      socket.data.userId = String(id);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);

    socket.on(
      "job:join",
      async (jobId: string, ack?: (err?: string) => void) => {
        try {
          if (!jobId || typeof jobId !== "string") {
            ack?.("Invalid jobId");
            return;
          }
          const job = await jobModel.findById(jobId).lean();
          if (!job) {
            ack?.("Job not found");
            return;
          }
          const owner = String(job.createdBy);
          const assigned = (job.assignedWorkerIds ?? []).map(String);
          if (owner !== userId && !assigned.includes(userId)) {
            ack?.("Forbidden");
            return;
          }
          await socket.join(`job:${jobId}`);
          ack?.();
        } catch {
          ack?.("Error");
        }
      },
    );

    socket.on(
      "chat:message",
      async (
        payload: { jobId?: string; toUserId?: string; text?: string },
        ack?: (err?: string, data?: unknown) => void,
      ) => {
        try {
          const { jobId, toUserId, text } = payload ?? {};
          if (!jobId || !toUserId || !text || typeof text !== "string") {
            ack?.("Invalid payload");
            return;
          }
          if (text.length > 5000) {
            ack?.("Message too long");
            return;
          }
          const job = await jobModel.findById(jobId).lean();
          if (!job) {
            ack?.("Job not found");
            return;
          }
          const owner = String(job.createdBy);
          const assigned = (job.assignedWorkerIds ?? []).map(String);
          if (owner !== userId && !assigned.includes(userId)) {
            ack?.("Forbidden");
            return;
          }
          const partner =
            userId === owner
              ? assigned.includes(toUserId)
              : toUserId === owner && assigned.includes(userId);
          if (!partner) {
            ack?.("Invalid recipient");
            return;
          }
          const doc = await chatMessageModel.create({
            jobId,
            fromUserId: userId,
            toUserId,
            text,
          });
          const out = doc.toObject();
          io.to(`job:${jobId}`).emit("chat:message", out);
          ack?.(undefined, out);
        } catch {
          ack?.("Error");
        }
      },
    );
  });

  return io;
}
