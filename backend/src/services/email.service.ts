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
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2B4162 0%, #12100E 100%); padding: 40px 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">WORKSY</h1>
                            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">YOUR WORKSPACE, YOUR WAY</p>
                        </td>
                    </tr>
                    <!-- Icon -->
                    <tr>
                        <td style="text-align: center; padding: 30px 0 0;">
                            <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #2B4162, #385F80); border-radius: 50%; margin: 0 auto; line-height: 70px; font-size: 32px;">
                                &#9993;
                            </div>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 24px 48px 16px; text-align: center;">
                            <h2 style="color: #1a1a2e; margin: 0 0 12px; font-size: 22px; font-weight: 600;">Verify Your Email Address</h2>
                            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0;">
                                Thanks for signing up! Please confirm your email address by clicking the button below.
                            </p>
                        </td>
                    </tr>
                    <!-- Button -->
                    <tr>
                        <td style="padding: 28px 48px; text-align: center;">
                            <a href="${verifyLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #2B4162 0%, #385F80 100%); color: #ffffff; padding: 14px 48px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(43,65,98,0.4);">
                                Verify Email
                            </a>
                        </td>
                    </tr>
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 48px;">
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
                        </td>
                    </tr>
                    <!-- Link fallback -->
                    <tr>
                        <td style="padding: 20px 48px; text-align: center;">
                            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">If the button doesn't work, copy and paste this link:</p>
                            <p style="color: #2B4162; word-break: break-all; font-size: 12px; margin: 0; background: #f3f4f6; padding: 10px; border-radius: 6px;">${verifyLink}</p>
                        </td>
                    </tr>
                    <!-- Expiry notice -->
                    <tr>
                        <td style="padding: 0 48px 24px; text-align: center;">
                            <p style="color: #d97706; font-size: 13px; margin: 0;">
                                This link will expire in <strong>24 hours</strong>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 48px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px;">If you didn't create an account, you can safely ignore this email.</p>
                            <p style="color: #d1d5db; font-size: 11px; margin: 0;">&copy; 2026 Worksy. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
    };

    await transporter.sendMail(mailOptions);
};
