import cors from "cors";
import express, { json, Request, Response } from "express";
import { getCorsOptions } from "./config/corsOptions";
import authRouter from "./routes/auth.route";
import applyRouter from "./routes/apply.route";
import jobRouter from "./routes/job.route";
import reviewRouter from "./routes/review.route";
import adminRouter from "./routes/admin.route";
import { errorHandler } from "./middlewares/error.middlewares";

const app = express();

app.use(cors(getCorsOptions()));
app.use(json());
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});
app.get("/", (_req: Request, res: Response) => {
  res.json("Connect successful");
});
app.use("/auth", authRouter);
app.use("/jobs", jobRouter);
app.use("/apply", applyRouter);
app.use("/review", reviewRouter);
app.use("/admin", adminRouter);
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});
app.use(errorHandler);

export default app;
