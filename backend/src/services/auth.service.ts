import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import USER_MESSAGE from "../constants/userMessage";
import HTTP_STATUS from "../constants/httpStatus";
import { sendForgotPasswordEmail } from "./email.service";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const loginService = async (email: string, password: string) => {
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (user.isDeleted) {
        throw new AppError("User account has been deleted", HTTP_STATUS.FORBIDDEN);
    }
    if (!user.password) {
        throw new AppError(
            "This account has no password (e.g. Google sign-in only). Please use Google login.",
            HTTP_STATUS.BAD_REQUEST,
        );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError(USER_MESSAGE.INVALID_PASSWORD, HTTP_STATUS.UNAUTHORIZED);
    }
    // Chặn login nếu email chưa verify; set ALLOW_UNVERIFIED_LOGIN=true trong .env để bỏ qua (chỉ dev)
    if (!user.isVerified && process.env.ALLOW_UNVERIFIED_LOGIN !== "true") {
        throw new AppError(USER_MESSAGE.EMAIL_NOT_VERIFIED, HTTP_STATUS.FORBIDDEN);
    }
    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user._id.toString(), user.role),
        signRefreshToken(user._id.toString(), user.role),
    ]);
    user.refreshToken = refreshToken;
    await user.save();

    return {
        message: USER_MESSAGE.LOGIN_SUCCESSFUL,
        accessToken,
        refreshToken,
        user: {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar ?? null,
        },
    };
}

export const registerService = async (
    name: string,
    email: string,
    password: string,
    confirm_password: string,
    location?: { lat: number; lng: number },
) => {
    const existing = await userModel.findOne({ email });
    if (existing) {
        throw new AppError(USER_MESSAGE.USER_ALREADY_EXISTS, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    if (password !== confirm_password) {
        throw new AppError(USER_MESSAGE.PASSWORD_NOT_MATCH, HTTP_STATUS.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = new ObjectId();

    const createData: Record<string, unknown> = { _id: user_id, name, email, password: hashedPassword, isVerified: true };
    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
        createData.location = { lat: location.lat, lng: location.lng };
    }
    await userModel.create(createData);

    return { message: USER_MESSAGE.REGISTER_SUCCESSFUL };
};

export const verifyEmailService = async (emailVerifyToken: string) => {
    const decoded = jwt.verify(emailVerifyToken, process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!) as { _id: string };

    const user = await userModel.findById(decoded._id);
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (user.isVerified) {
        throw new AppError(USER_MESSAGE.EMAIL_ALREADY_VERIFIED, HTTP_STATUS.BAD_REQUEST);
    }

    await userModel.updateOne({ _id: decoded._id }, { isVerified: true, emailVerifyToken: "" });

    return { message: USER_MESSAGE.VERIFY_EMAIL_SUCCESSFUL };
}

export const resendVerifyEmailService = async (email: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (user.isVerified) {
        throw new AppError(USER_MESSAGE.EMAIL_ALREADY_VERIFIED, HTTP_STATUS.BAD_REQUEST);
    }
    return { message: USER_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESSFUL };
}

export const forgotPasswordService = async (email: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await userModel.updateOne(
        { _id: user._id },
        { forgotPasswordOTP: otp, forgotPasswordOTPExpiry: otpExpiry }
    );

    await sendForgotPasswordEmail(email, otp);

    return { message: USER_MESSAGE.FORGOT_PASSWORD_EMAIL_SENT };
}

export const verifyForgotPasswordOTPService = async (email: string, otp: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (!user.forgotPasswordOTPExpiry || user.forgotPasswordOTPExpiry < new Date()) {
        throw new AppError(USER_MESSAGE.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST);
    }
    if (user.forgotPasswordOTP !== otp) {
        throw new AppError(USER_MESSAGE.INVALID_OTP, HTTP_STATUS.BAD_REQUEST);
    }

    return { message: USER_MESSAGE.VERIFY_OTP_SUCCESSFUL };
}

export const resetPasswordService = async (email: string, otp: string, password: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (!user.forgotPasswordOTPExpiry || user.forgotPasswordOTPExpiry < new Date()) {
        throw new AppError(USER_MESSAGE.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST);
    }
    if (user.forgotPasswordOTP !== otp) {
        throw new AppError(USER_MESSAGE.INVALID_OTP, HTTP_STATUS.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.updateOne(
        { _id: user._id },
        { password: hashedPassword, forgotPasswordOTP: "", forgotPasswordOTPExpiry: null }
    );

    return { message: USER_MESSAGE.RESET_PASSWORD_SUCCESSFUL };
}

export const logoutService = async (userId: string) => {
    await userModel.updateOne({ _id: userId }, { refreshToken: "" });
    return { message: USER_MESSAGE.LOGOUT_SUCCESSFUL };
}

export const refreshTokenService = async (refreshToken: string) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN!) as { _id: string; role: string };

    const user = await userModel.findById(decoded._id);
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    if (user.refreshToken !== refreshToken) {
        throw new AppError(USER_MESSAGE.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
        signAccessToken(user._id.toString(), user.role),
        signRefreshToken(user._id.toString(), user.role),
    ]);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
