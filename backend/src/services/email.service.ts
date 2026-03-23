import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const sendVerifyEmail = async (to: string, emailVerifyToken: string) => {
    const verifyLink = `${process.env.CLIENT_URL}/auth/verify-email?token=${emailVerifyToken}`;

    const mailOptions = {
        from: `"Worksy" <${process.env.GMAIL_USER}>`,
        to,
        subject: "Verify your email - Worksy",
        html: `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2B4162;">Worksy</h2>
    <hr style="border: none; border-top: 1px solid #eee;">
    <h3>Verify Your Email Address</h3>
    <p>Thanks for signing up! Please click the button below to verify your email address.</p>
    <a href="${verifyLink}" style="display: inline-block; background: #2B4162; color: #fff; padding: 10px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
    <p style="font-size: 13px; color: #888;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #2B4162;">${verifyLink}</p>
    <p style="font-size: 13px; color: #d97706;">⏰ This link will expire in <strong>24 hours</strong></p>
    <hr style="border: none; border-top: 1px solid #eee;">
    <p style="font-size: 11px; color: #aaa;">If you didn't create an account, you can safely ignore this email.</p>
    <p style="font-size: 11px; color: #ccc;">&copy; 2026 Worksy. All rights reserved.</p>
</div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

export const sendForgotPasswordEmail = async (to: string, otp: string) => {
    const mailOptions = {
        from: `"Worksy" <${process.env.GMAIL_USER}>`,
        to,
        subject: "Password Reset OTP - Worksy",
        html: `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2B4162;">Worksy</h2>
    <hr style="border: none; border-top: 1px solid #eee;">
    <h3>Password Reset OTP</h3>
    <p>Use the following OTP to reset your password:</p>
    <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f5f5f5; padding: 16px 32px; border-radius: 8px; border: 1px solid #ddd;">${otp}</span>
    </div>
    <p style="font-size: 13px; color: #d97706;">⏰ This OTP will expire in <strong>10 minutes</strong></p>
    <hr style="border: none; border-top: 1px solid #eee;">
    <p style="font-size: 11px; color: #aaa;">If you didn't request a password reset, you can safely ignore this email.</p>
    <p style="font-size: 11px; color: #ccc;">&copy; 2026 Worksy. All rights reserved.</p>
</div>
        `,
    };

    await transporter.sendMail(mailOptions);
};
