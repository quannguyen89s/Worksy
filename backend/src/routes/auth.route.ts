import { Router } from "express";
import { loginController, registerController } from "../controllers/auth.controller";
import { loginMiddleware, registerMiddleware } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.post("/login", loginMiddleware, loginController);
authRouter.post("/register", registerMiddleware, registerController);

export default authRouter;
