import { Router } from "express";
import { loginController, registerController, verifyEmailController, verifyEmailByLinkController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordOTPController, resetPasswordController, logoutController } from "../controllers/auth.controller";
import { loginValidator, registerValidator, emailVerifyValidator, resendVerifyEmailValidator, forgotPasswordValidator, verifyOTPValidator, resetPasswordValidator, authenticateToken } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.post("/login", loginValidator, loginController);
authRouter.post("/register", registerValidator, registerController);
authRouter.post("/verify-email", emailVerifyValidator, verifyEmailController);
authRouter.get("/verify-email", verifyEmailByLinkController);
authRouter.post("/resend-verify-email", resendVerifyEmailValidator, resendVerifyEmailController);
authRouter.post("/forgot-password", forgotPasswordValidator, forgotPasswordController);
authRouter.post("/verify-otp", verifyOTPValidator, verifyForgotPasswordOTPController);
authRouter.post("/reset-password", resetPasswordValidator, resetPasswordController);
authRouter.post("/logout", authenticateToken, logoutController);

export default authRouter;