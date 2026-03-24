import cors from "cors";
import express, { json, Request, Response, urlencoded } from "express";
import path from "path";
import { getCorsOptions } from "./config/corsOptions";
import { errorHandler } from "./middlewares/error.middlewares";

import authRouter from "./routes/auth.route";
import applyRouter from "./routes/apply.route";
import jobRouter from "./routes/job.route";
import reviewRouter from "./routes/review.route";
import adminRouter from "./routes/admin.route";
import chatRouter from "./routes/chat.routes";
import notificationRouter from "./routes/notification.routes";
import userRouter from "./routes/user.routes";

import "./models/user.model";
import "./models/job.model";
import "./models/application.model";import profileRouter from "./routes/profile.route";


const app = express();

app.use(cors(getCorsOptions()));
app.use(json({ limit: '20mb' }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(urlencoded({ extended: true, limit: '20mb' }));

app.use("/profile", profileRouter)
app.get("/", (_req: Request, res: Response) => {
  res.json("Connect successful");
});

app.use("/auth", authRouter);
app.use("/jobs", jobRouter);
app.use("/apply", applyRouter);
app.use("/review", reviewRouter);
app.use("/admin", adminRouter);
app.use("/chat", chatRouter);
app.use("/notifications", notificationRouter);
app.use("/users", userRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});
app.use(errorHandler);

export default app;
