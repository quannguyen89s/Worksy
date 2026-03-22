import express, { json, Request, Response } from "express";
import connectDB from "./config/db";


const app = express();

connectDB();
app.use(json());

app.use("/", (req: Request, res: Response) => {
  res.json('Connect succesfull')
});


export default app;
