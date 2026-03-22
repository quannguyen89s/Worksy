import { Router } from "express";
import { loginController, registerController, verifyEmailController, verifyEmailByLinkController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordTokenController, verifyForgotPasswordByLinkController } from "../controllers/auth.controller";
import { loginMiddleware, registerMiddleware, verifyEmailMiddleware, resendVerifyEmailMiddleware, forgotPasswordMiddleware, verifyForgotPasswordTokenMiddleware } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.post("/login", loginMiddleware, loginController);
authRouter.post("/register", registerMiddleware, registerController);
authRouter.post("/verify-email", verifyEmailMiddleware, verifyEmailController);
authRouter.get("/verify-email", verifyEmailByLinkController);
authRouter.post("/resend-verify-email", resendVerifyEmailMiddleware, resendVerifyEmailController);
authRouter.post("/forgot-password", forgotPasswordMiddleware, forgotPasswordController);
authRouter.get("/verify-forgot-password-token", verifyForgotPasswordByLinkController);
authRouter.post("/verify-forgot-password-token", verifyForgotPasswordTokenMiddleware, verifyForgotPasswordTokenController);

export default authRouter;