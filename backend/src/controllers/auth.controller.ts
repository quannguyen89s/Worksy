import { Request, Response } from "express";
import { loginService, registerService, verifyEmailService, resendVerifyEmailService, forgotPasswordService, verifyForgotPasswordOTPService, resetPasswordService, logoutService } from "../services/auth.service";
import { googleLoginService } from "../services/google.service";
import { LoginRequestBody, RegisterRequestBody, VerifyEmailRequestBody, ForgotPasswordRequestBody, VerifyForgotPasswordOTPRequestBody, ResetPasswordRequestBody } from "../models/request/user.request";
import { ParamsDictionary } from "express-serve-static-core";
import HTTP_STATUS from "../constants/httpStatus";
import USER_MESSAGE from "../constants/userMessage";
import { AppError } from "../utils/AppError";

const handleError = (error: unknown, res: Response) => {
    console.log(error);
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginService(email, password);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const logoutController = async (req: Request, res: Response) => {
    try {
        const user = req.user as { _id: string };
        const result = await logoutService(user._id);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const googleLoginController = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Google ID token is required" });
        }
        const result = await googleLoginService(idToken);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
    try {
        const { name, email, password, confirm_password } = req.body;
        const result = await registerService(name, email, password, confirm_password);
        return res.status(HTTP_STATUS.CREATED).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailRequestBody>, res: Response) => {
    try {
        const { emailVerifyToken } = req.body;
        const result = await verifyEmailService(emailVerifyToken);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const result = await resendVerifyEmailService(email);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

// Template đơn giản cho trang verify email qua link
const verifyPageTemplate = (type: "success" | "error", title: string, message: string) => {
    const icon = type === "success" ? "✅" : "❌";
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Worksy</title>
</head>
<body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
    <div style="background: #fff; padding: 40px; max-width: 450px; width: 90%; text-align: center; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2B4162; margin-bottom: 20px;">Worksy</h2>
        <p style="font-size: 32px; margin-bottom: 16px;">${icon}</p>
        <h3 style="margin-bottom: 12px;">${title}</h3>
        <p style="color: #666; margin-bottom: 24px;">${message}</p>
        <p style="color: #ccc; font-size: 11px; margin-top: 24px;">&copy; 2026 Worksy. All rights reserved.</p>
    </div>
</body>
</html>`;
};

export const verifyEmailByLinkController = async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;
        if (!token) {
            return res.status(HTTP_STATUS.BAD_REQUEST).send(
                verifyPageTemplate("error", "Invalid Link", "The verification link is invalid or missing. Please check your email and try again.")
            );
        }
        const result = await verifyEmailService(token);
        return res.status(HTTP_STATUS.OK).send(
            verifyPageTemplate("success", "Email Verified!", result.message + ". You can now login to your account.")
        );
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(
            verifyPageTemplate("error", "Verification Failed", "The link may have expired or is invalid. Please register again or request a new verification email.")
        );
    }
}

export const forgotPasswordController = async (req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>, res: Response) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordService(email);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const verifyForgotPasswordOTPController = async (req: Request<ParamsDictionary, any, VerifyForgotPasswordOTPRequestBody>, res: Response) => {
    try {
        const { email, otp } = req.body;
        const result = await verifyForgotPasswordOTPService(email, otp);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}

export const resetPasswordController = async (req: Request<ParamsDictionary, any, ResetPasswordRequestBody>, res: Response) => {
    try {
        const { email, otp, password } = req.body;
        const result = await resetPasswordService(email, otp, password);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
}
