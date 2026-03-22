import { Router } from "express";
import { loginController, registerController, verifyEmailController, verifyEmailByLinkController, resendVerifyEmailController } from "../controllers/auth.controller";
import { loginMiddleware, registerMiddleware, verifyEmailMiddleware, resendVerifyEmailMiddleware } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.post("/login", loginMiddleware, loginController);
authRouter.post("/register", registerMiddleware, registerController);
authRouter.post("/verify-email", verifyEmailMiddleware, verifyEmailController);
authRouter.get("/verify-email", verifyEmailByLinkController);
authRouter.post("/resend-verify-email", resendVerifyEmailMiddleware, resendVerifyEmailController);

export default authRouter;
