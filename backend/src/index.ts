import "dotenv/config";
import "./types/express-augment";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

import app from "./server";
import connectDB from "./config/db";
import { initSocket } from "./socket/socket";
import { completeOverdueJobs } from "./services/job.service";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST ?? "0.0.0.0";
const AUTO_DONE_SWEEP_MS = Math.max(
  10000,
  Number(process.env.JOB_AUTO_DONE_SWEEP_MS ?? 60000),
);

let autoDoneTimer: NodeJS.Timeout | null = null;

function startAutoDoneScheduler() {
  if (autoDoneTimer) return;
  autoDoneTimer = setInterval(async () => {
    const result = await completeOverdueJobs();
    if (result.completed > 0) {
      console.log(
        `[job:auto-done] completed=${result.completed}, scanned=${result.scanned}`,
      );
    }
  }, AUTO_DONE_SWEEP_MS);
}

async function start() {
  await connectDB();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  startAutoDoneScheduler();
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

start();
