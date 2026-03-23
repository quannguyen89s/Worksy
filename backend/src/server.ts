import express, { json, Request, Response } from "express";
import path from "path";
import connectDB from "./config/db";
import authRouter from "./routes/auth.route";
import profileRouter from "./routes/profile.route";


const app = express();

connectDB();
app.use(json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/auth", authRouter)
app.use("/profile", profileRouter)
app.get("/", (req: Request, res: Response) => {
  res.json('Connect succesfull')
});


export default app;
