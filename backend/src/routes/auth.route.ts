import { Router } from "express";
import { loginController, registerController, verifyEmailController, verifyEmailByLinkController, resendVerifyEmailController, forgotPasswordController, verifyForgotPasswordTokenController, verifyForgotPasswordByLinkController } from "../controllers/auth.controller";
import { loginValidator, registerValidator, emailVerifyValidator, resendVerifyEmailValidator, forgotPasswordValidator, verifyForgotPasswordTokenValidator } from "../middlewares/auth.middlewares";

const authRouter = Router();

authRouter.post("/login", loginValidator, loginController);
authRouter.post("/register", registerValidator, registerController);
authRouter.post("/verify-email", emailVerifyValidator, verifyEmailController);
authRouter.get("/verify-email", verifyEmailByLinkController);
authRouter.post("/resend-verify-email", resendVerifyEmailValidator, resendVerifyEmailController);
authRouter.post("/forgot-password", forgotPasswordValidator, forgotPasswordController);
authRouter.get("/verify-forgot-password-token", verifyForgotPasswordByLinkController);
authRouter.post("/verify-forgot-password-token", verifyForgotPasswordTokenValidator, verifyForgotPasswordTokenController);

export default authRouter;