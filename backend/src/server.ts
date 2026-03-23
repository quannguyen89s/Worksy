import express, { json, Request, Response, urlencoded } from "express";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.route";
import chatRoutes from "./routes/chat.routes";
import notificationRoutes from "./routes/notification.routes";
import userRoutes from "./routes/user.routes";

import "./models/user.model";
import "./models/job.model";
import "./models/application.model";

const app = express();

connectDB();
app.use(json({ limit: '20mb' }));
app.use(urlencoded({ extended: true, limit: '20mb' }));

app.get("/", (req: Request, res: Response) => {
    res.json('Connect succesfull')
});

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);

export default app;
