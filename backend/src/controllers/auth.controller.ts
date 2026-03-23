import { Request, Response } from "express";
import { loginService, registerService, verifyEmailService, resendVerifyEmailService, forgotPasswordService, verifyForgotPasswordTokenService } from "../services/auth.service";
import { LoginRequestBody, RegisterRequestBody, VerifyEmailRequestBody, ForgotPasswordRequestBody, VerifyForgotPasswordRequestBody } from "../models/request/user.request";
import { ParamsDictionary } from "express-serve-static-core";
import HTTP_STATUS from "../constants/httpStatus";
import USER_MESSAGE from "../constants/userMessage";

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginService(email, password);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
    }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
    try {
        const { name, email, password, confirm_password } = req.body;
        const result = await registerService(name, email, password, confirm_password);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
    }
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailRequestBody>, res: Response) => {
    try {
        const { emailVerifyToken } = req.body;
        const result = await verifyEmailService(emailVerifyToken);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
    }
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const result = await resendVerifyEmailService(email);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
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
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
    }
}

export const verifyForgotPasswordTokenController = async (req: Request<ParamsDictionary, any, VerifyForgotPasswordRequestBody>, res: Response) => {
    try {
        const { forgotPasswordToken } = req.body;
        const result = await verifyForgotPasswordTokenService(forgotPasswordToken);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGE.INTERNAL_SERVER_ERROR });
    }
}

export const verifyForgotPasswordByLinkController = async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;
        if (!token) {
            return res.status(HTTP_STATUS.BAD_REQUEST).send(
                resetPasswordPageTemplate("error", "Invalid Link", "The password reset link is invalid or missing. Please request a new one.", "")
            );
        }
        const result = await verifyForgotPasswordTokenService(token);
        return res.status(HTTP_STATUS.OK).send(
            resetPasswordPageTemplate("success", "Token Verified!", result.message + ". Click the button below to create your new password.", token)
        );
    } catch (error) {
        console.log(error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(
            resetPasswordPageTemplate("expired", "Link Expired", "The reset link has expired or is invalid. Please enter your email to receive a new reset link.", "")
        );
    }
}

const getResetActionContent = (type: "success" | "error" | "expired", token: string): string => {
    if (type === "success") {
        return "";
    }
    if (type === "expired") {
        return '<div style="margin-top:8px;">'
            + '<input type="email" id="resendEmail" placeholder="Enter your email" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:14px;margin-bottom:12px;" />'
            + '<button onclick="resendForgotPassword()" id="resendBtn" style="background:#2B4162;color:#fff;padding:10px 24px;border:none;border-radius:4px;cursor:pointer;font-size:14px;">Resend Reset Link</button>'
            + '<div id="resultMsg" style="margin-top:12px;padding:8px;border-radius:4px;font-size:13px;"></div>'
            + '</div>'
            + '<script>'
            + 'async function resendForgotPassword(){'
            + 'var e=document.getElementById("resendEmail").value;'
            + 'var b=document.getElementById("resendBtn");'
            + 'var m=document.getElementById("resultMsg");'
            + 'if(!e){m.style.background="#fef2f2";m.style.color="#dc2626";m.textContent="Please enter your email.";return;}'
            + 'b.textContent="Sending...";b.disabled=true;'
            + 'try{var r=await fetch("/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e})});'
            + 'var d=await r.json();m.style.background="#ecfdf5";m.style.color="#059669";m.textContent=d.message||"Reset link sent!"}'
            + 'catch(x){m.style.background="#fef2f2";m.style.color="#dc2626";m.textContent="Something went wrong."}'
            + 'b.textContent="Resend Reset Link";b.disabled=false;}'
            + '</script>';
    }
    return "";
}

const resetPasswordPageTemplate = (type: "success" | "error" | "expired", title: string, message: string, token: string) => {
    const iconMap = { success: "✅", expired: "⏰", error: "❌" };
    const actionContent = getResetActionContent(type, token);

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
        <p style="font-size: 32px; margin-bottom: 16px;">${iconMap[type]}</p>
        <h3 style="margin-bottom: 12px;">${title}</h3>
        <p style="color: #666; margin-bottom: 24px;">${message}</p>
        ${actionContent}
        <p style="color: #ccc; font-size: 11px; margin-top: 24px;">&copy; 2026 Worksy. All rights reserved.</p>
    </div>
</body>
</html>`;
};
