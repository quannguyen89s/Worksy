import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import USER_MESSAGE from "../constants/userMessage";
import { sendVerifyEmail, sendForgotPasswordEmail } from "./email.service";

const signAccessToken = (userId: string, role: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId, role }, process.env.JWT_SECRET_ACCESS_TOKEN!, { expiresIn: "1h" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}

const signRefreshToken = (userId: string, role: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId, role }, process.env.JWT_SECRET_REFRESH_TOKEN!, { expiresIn: "7d" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}

const signEmailVerifyToken = (userId: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId }, process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!, { expiresIn: "1d" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}

const signForgotPasswordToken = (userId: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId }, process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN!, { expiresIn: "1h" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}

export const loginService = async (email: string, password: string) => {

    const user = await userModel.findOne({ email });
    if (!user) {
        return { message: USER_MESSAGE.USER_NOT_FOUND };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { message: USER_MESSAGE.INVALID_PASSWORD };
    }
    if (!user.isVerified) {
        return { message: USER_MESSAGE.EMAIL_NOT_VERIFIED };
    }
    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user._id.toString(), user.role),
        signRefreshToken(user._id.toString(), user.role),
    ]);
    user.refreshToken = refreshToken;
    await user.save();

    return { message: USER_MESSAGE.LOGIN_SUCCESSFUL, accessToken, refreshToken };
}

export const registerService = async (name: string, email: string, password: string, confirm_password: string) => {
    const user = await userModel.findOne({ email });
    if (user) {
        return { message: USER_MESSAGE.USER_ALREADY_EXISTS };
    }
    if (password !== confirm_password) {
        return { message: USER_MESSAGE.PASSWORD_NOT_MATCH };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = new ObjectId()

    const emailVerifyToken = await signEmailVerifyToken(user_id.toString());
    await userModel.create({ _id: user_id, name, email, password: hashedPassword, emailVerifyToken });

    await sendVerifyEmail(email, emailVerifyToken);

    return { message: USER_MESSAGE.REGISTER_SUCCESSFUL, emailVerifyToken };
}

export const verifyEmailService = async (emailVerifyToken: string) => {
    const decoded = jwt.verify(emailVerifyToken, process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!) as { _id: string };

    const user = await userModel.findById(decoded._id);
    if (!user) {
        return { message: USER_MESSAGE.USER_NOT_FOUND };
    }
    if (user.isVerified) {
        return { message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED };
    }
    if (user.emailVerifyToken !== emailVerifyToken) {
        return { message: USER_MESSAGE.INVALID_EMAIL_VERIFY_TOKEN };
    }

    await userModel.updateOne({ _id: decoded._id }, { isVerified: true, emailVerifyToken: "" });

    return { message: USER_MESSAGE.VERIFY_EMAIL_SUCCESSFUL };
}

export const resendVerifyEmailService = async (email: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        return { message: USER_MESSAGE.USER_NOT_FOUND };
    }
    if (user.isVerified) {
        return { message: USER_MESSAGE.EMAIL_ALREADY_VERIFIED };
    }

    const emailVerifyToken = await signEmailVerifyToken(user._id.toString());
    await userModel.updateOne({ _id: user._id }, { emailVerifyToken });

    await sendVerifyEmail(email, emailVerifyToken);

    return { message: USER_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESSFUL, emailVerifyToken };
}

export const forgotPasswordService = async (email: string) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        return { message: USER_MESSAGE.USER_NOT_FOUND };
    }

    const forgotPasswordToken = await signForgotPasswordToken(user._id.toString());
    await userModel.updateOne({ _id: user._id }, { forgotPasswordToken });

    await sendForgotPasswordEmail(email, forgotPasswordToken);

    return { message: USER_MESSAGE.FORGOT_PASSWORD_EMAIL_SENT, forgotPasswordToken };
}

export const verifyForgotPasswordTokenService = async (forgotPasswordToken: string) => {
    const decoded = jwt.verify(forgotPasswordToken, process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN!) as { _id: string };

    const user = await userModel.findById(decoded._id);
    if (!user) {
        return { message: USER_MESSAGE.USER_NOT_FOUND };
    }
    if (user.forgotPasswordToken !== forgotPasswordToken) {
        return { message: USER_MESSAGE.INVALID_FORGOT_PASSWORD_TOKEN };
    }

    return { message: USER_MESSAGE.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESSFUL };
}
