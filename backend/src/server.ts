import express, { json, Request, Response } from "express";
import connectDB from "./config/db";
import authRouter from "./routes/auth.route";


const app = express();

connectDB();
app.use(json());
app.use("/auth", authRouter)
app.get("/", (req: Request, res: Response) => {
  res.json('Connect succesfull')
});


export default app;
