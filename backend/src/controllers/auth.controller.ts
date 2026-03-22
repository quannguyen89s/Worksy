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

const verifyPageTemplate = (type: "success" | "error", title: string, message: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Worksy</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f2f5 0%, #e2e8f0 100%);
        }
        .card {
            background: #ffffff;
            border-radius: 20px;
            padding: 48px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .icon-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 36px;
        }
        .icon-success {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        .icon-error {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
        }
        .brand {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 3px;
            color: #2B4162;
            margin-bottom: 24px;
        }
        h1 {
            color: #1a1a2e;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        p {
            color: #6b7280;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #2B4162, #385F80);
            color: #ffffff;
            padding: 12px 36px;
            text-decoration: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 14px rgba(43,65,98,0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(43,65,98,0.4);
        }
        .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #d1d5db;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">WORKSY</div>
        <div class="icon-circle icon-${type}">
            ${type === "success" ? "&#10003;" : "&#10007;"}
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="${process.env.CLIENT_URL || "/"}" class="btn">Go to Homepage</a>
        <div class="footer">&copy; 2026 Worksy. All rights reserved.</div>
    </div>
</body>
</html>
`;

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
        const newPasswordUrl = (process.env.CLIENT_URL || "") + "/auth/new-password?token=" + token;
        return '<a href="' + newPasswordUrl + '" class="btn">Create New Password</a>';
    }
    if (type === "expired") {
        return '<div class="resend-form">'
            + '<input type="email" id="resendEmail" placeholder="Enter your email address" />'
            + '<button class="btn" onclick="resendForgotPassword()" id="resendBtn">Resend Reset Link</button>'
            + '<div id="resultMessage" class="result-message"></div>'
            + '</div>'
            + '<script>'
            + 'async function resendForgotPassword() {'
            + '  var email = document.getElementById("resendEmail").value;'
            + '  var btn = document.getElementById("resendBtn");'
            + '  var msg = document.getElementById("resultMessage");'
            + '  if (!email) { msg.className = "result-message result-error"; msg.textContent = "Please enter your email address."; return; }'
            + '  btn.textContent = "Sending..."; btn.disabled = true;'
            + '  try {'
            + '    var res = await fetch("/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email }) });'
            + '    var data = await res.json();'
            + '    msg.className = "result-message result-success";'
            + '    msg.textContent = data.message || "A new reset link has been sent to your email!";'
            + '  } catch (err) {'
            + '    msg.className = "result-message result-error";'
            + '    msg.textContent = "Something went wrong. Please try again.";'
            + '  }'
            + '  btn.textContent = "Resend Reset Link"; btn.disabled = false;'
            + '}'
            + '</script>';
    }
    return '<a href="' + (process.env.CLIENT_URL || "/") + '" class="btn">Go to Homepage</a>';
}

const resetPasswordPageTemplate = (type: "success" | "error" | "expired", title: string, message: string, token: string) => {
    const iconMap = { success: "&#10003;", expired: "&#9203;", error: "&#10007;" };
    const actionContent = getResetActionContent(type, token);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Worksy</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f2f5 0%, #e2e8f0 100%);
        }
        .card {
            background: #ffffff;
            border-radius: 20px;
            padding: 48px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .icon-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 36px;
        }
        .icon-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
        .icon-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .icon-expired { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        .brand {
            font-size: 14px; font-weight: 700; letter-spacing: 3px;
            color: #2B4162; margin-bottom: 24px;
        }
        h1 { color: #1a1a2e; font-size: 24px; font-weight: 600; margin-bottom: 12px; }
        p { color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #2B4162, #385F80);
            color: #ffffff; padding: 12px 36px; text-decoration: none;
            border-radius: 8px; font-size: 15px; font-weight: 600;
            letter-spacing: 0.5px; border: none; cursor: pointer;
            box-shadow: 0 4px 14px rgba(43,65,98,0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(43,65,98,0.4); }
        .resend-form { margin-top: 8px; }
        .resend-form input {
            width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb;
            border-radius: 8px; font-size: 15px; margin-bottom: 16px;
            outline: none; transition: border-color 0.2s;
        }
        .resend-form input:focus { border-color: #2B4162; }
        .result-message {
            margin-top: 12px; padding: 10px 16px; border-radius: 8px;
            font-size: 14px; display: none;
        }
        .result-success { background: #ecfdf5; color: #059669; display: block; }
        .result-error { background: #fef2f2; color: #dc2626; display: block; }
        .footer {
            margin-top: 32px; padding-top: 20px;
            border-top: 1px solid #e5e7eb; color: #d1d5db; font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">WORKSY</div>
        <div class="icon-circle icon-${type}">
            ${iconMap[type]}
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
        ${actionContent}
        <div class="footer">&copy; 2026 Worksy. All rights reserved.</div>
    </div>
</body>
</html>
`;
};

