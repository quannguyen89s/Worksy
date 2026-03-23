import "./types/express-augment";
import http from "http";
import app from "./server";
import connectDB from "./config/db";
import { initSocket } from "./sockets/initSocket";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST ?? "0.0.0.0";

async function start() {
  await connectDB();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
