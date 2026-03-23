import "./types/express-augment";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

import app from "./server";
import { initSocket } from "./socket/socket";

const _listen = app.listen.bind(app);
app.listen = ((...args: Parameters<typeof app.listen>) => {
  const server = _listen(...args);
  initSocket(server);
  return server;
}) as typeof app.listen;

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
