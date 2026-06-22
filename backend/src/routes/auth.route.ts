import { Router } from "express";
import { loginController, registerController, verifyEmailController, verifyEmailByLinkController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordOTPController, resetPasswordController, logoutController, googleAuthController, googleCallbackController, googleTokenController, refreshTokenController } from "../controllers/auth.controller";
import { loginValidator, registerValidator, emailVerifyValidator, resendVerifyEmailValidator, forgotPasswordValidator, verifyOTPValidator, resetPasswordValidator, authenticateToken, googleIdTokenValidator } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.post("/login", loginValidator, loginController);
authRouter.post("/register", registerValidator, registerController);
authRouter.post("/verify-email", emailVerifyValidator, verifyEmailController);
authRouter.get("/verify-email", verifyEmailByLinkController);
authRouter.post("/resend-verify-email", resendVerifyEmailValidator, resendVerifyEmailController);
authRouter.post("/forgot-password", forgotPasswordValidator, forgotPasswordController);
authRouter.post("/verify-otp", verifyOTPValidator, verifyForgotPasswordOTPController);
authRouter.post("/reset-password", resetPasswordValidator, resetPasswordController);
authRouter.post("/refresh-token", refreshTokenController);
authRouter.post("/logout", authenticateToken, logoutController);
authRouter.post("/google-token", googleIdTokenValidator, googleTokenController);
authRouter.get("/google", googleAuthController);
authRouter.get("/google/callback", googleCallbackController);

export default authRouter;