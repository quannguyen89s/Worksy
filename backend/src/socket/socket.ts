import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import chatService from "../services/chat.service";
import notificationService from "../services/notification.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface SendMessagePayload {
  conversationId: string;
  content: string;
  type?: "text" | "image" | "file";
}

// ─── Singleton io + online users ──────────────────────────────────────────────

let io: Server;

/** Set userId của các user đang kết nối socket */
const onlineUsers = new Set<string>();

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io chưa được khởi tạo");
  return io;
}

/**
 * Gửi notification realtime đến một user.
 * Dùng ở bất kỳ service nào sau khi import hàm này.
 */
export function emitNotification(
  userId: string,
  notification: Record<string, unknown>
): void {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 20000,
    maxHttpBufferSize: 10 * 1024 * 1024, // 10 MB cho ảnh
  });

  // JWT auth middleware cho Socket.io
  io.use((socket: AuthSocket, next) => {
    const token =
      (socket.handshake.auth as Record<string, string | undefined>)["token"] ??
      socket.handshake.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Xác thực thất bại: không có token"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as {
        id: string;
        role: string;
      };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Token không hợp lệ"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`[Socket] User kết nối: ${userId} (${socket.id})`);

    // Tham gia phòng riêng để nhận notification
    void socket.join(`user:${userId}`);

    // Đánh dấu user online và broadcast cho TẤT CẢ clients
    onlineUsers.add(userId);
    io.emit("user_online", { userId });

    // ── Chat Events ────────────────────────────────────────────────────────

    /**
     * Client join vào phòng conversation khi mở màn hình chat.
     * payload: conversationId (string)
     */
    socket.on("join_conversation", (conversationId: string) => {
      void socket.join(`conversation:${conversationId}`);
      // Thông báo cho người kia biết mình online
      socket.to(`conversation:${conversationId}`).emit("user_online", { userId });
    });

    /** Client hỏi trạng thái online của một user */
    socket.on("check_online", (targetUserId: string, callback: (res: { online: boolean }) => void) => {
      if (typeof callback === "function") {
        callback({ online: onlineUsers.has(targetUserId) });
      }
    });

    /**
     * Client rời phòng conversation khi đóng màn hình.
     */
    socket.on("leave_conversation", (conversationId: string) => {
      void socket.leave(`conversation:${conversationId}`);
    });

    /**
     * Gửi tin nhắn mới.
     * payload: { conversationId, content, type? }
     */
    socket.on("send_message", async (payload: SendMessagePayload) => {
      const { conversationId, content, type = "text" } = payload;
      // Với ảnh (base64) không trim, chỉ trim text
      const finalContent = type === "text" ? content?.trim() : content;

      if (!conversationId || !finalContent) {
        socket.emit("error", { message: "conversationId và content là bắt buộc" });
        return;
      }

      try {
        const message = await chatService.sendMessage(
          conversationId,
          userId,
          finalContent,
          type
        );

        // Broadcast tin nhắn cho tất cả thành viên đang trong phòng chat
        io.to(`conversation:${conversationId}`).emit("new_message", message);

        // Lấy thông tin conversation để tìm recipient
        const conversation =
          await chatService.getConversationWithParticipants(conversationId);

        if (conversation) {
          const participants = conversation.participants as unknown as Array<{
            _id: { toString(): string };
            name: string;
          }>;

          for (const participant of participants) {
            const pid = participant._id.toString();

            // Emit conversation_updated vào personal room của TẤT CẢ participants
            // (kể cả người gửi) để MessagesScreen cập nhật danh sách
            io.to(`user:${pid}`).emit("conversation_updated", {
              conversationId,
              message,
            });

            if (pid !== userId) {
              // Tạo notification và push realtime cho người nhận
              const notification = await notificationService.create(
                pid,
                "new_message",
                "Tin nhắn mới",
                `Bạn có tin nhắn mới`,
                {
                  conversationId,
                  messageId: (message as unknown as { _id: unknown })._id,
                }
              );
              io.to(`user:${pid}`).emit("notification", notification);
            }
          }
        }
      } catch (err) {
        console.error("[Socket] send_message error:", err);
        socket.emit("error", { message: "Không thể gửi tin nhắn" });
      }
    });

    /**
     * Đang nhập — phát cho các thành viên khác trong phòng.
     */
    socket.on("typing", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId,
        conversationId,
      });
    });

    socket.on("stop_typing", (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
        userId,
        conversationId,
      });
    });

    /**
     * Đánh dấu đã đọc và thông báo cho phòng.
     */
    socket.on("mark_read", async (conversationId: string) => {
      try {
        await chatService.markMessagesRead(conversationId, userId);
        socket.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (err) {
        console.error("[Socket] mark_read error:", err);
        socket.emit("error", { message: "Không thể đánh dấu đọc" });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────

    /** Batch-check nhiều user cùng lúc */
    socket.on("get_online_users", (userIds: string[], callback: (online: string[]) => void) => {
      if (typeof callback === "function") {
        callback(userIds.filter((id) => onlineUsers.has(id)));
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User ngắt kết nối: ${userId} — reason: ${reason}`);
      onlineUsers.delete(userId);
      // Broadcast offline cho TẤT CẢ clients
      io.emit("user_offline", { userId });
    });
  });

  return io;
}
