import "./types/express-augment";
import http from "http";
import app from "./server";
import { initSocket } from "./sockets/initSocket";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST ?? "0.0.0.0";

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
