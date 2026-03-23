import { NextFunction, Request, Response } from "express";
import { checkSchema } from "express-validator";
import userModel from "../models/user.model";
import { validate } from "../utils/validation";
import USER_MESSAGE from "../constants/userMessage";
import jwt from "jsonwebtoken";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: USER_MESSAGE.TOKEN_REQUIRED });
    }
    jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN!, (err, user) => {
        if (err) {
            return res.status(403).json({ message: USER_MESSAGE.INVALID_TOKEN });
        }
        const decoded = user as unknown as { _id?: string; id?: string; role?: string; name?: string };
        req.user = {
            id: String(decoded._id ?? decoded.id ?? ""),
            role: String(decoded.role ?? ""),
            name: String(decoded.name ?? ""),
        };
        next();
    });
}

export const authorizeToken = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: USER_MESSAGE.TOKEN_REQUIRED });
        }
        jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN!, (err, user) => {
            if (err) {
                return res.status(403).json({ message: USER_MESSAGE.INVALID_TOKEN });
            }
            const decoded = user as unknown as { _id?: string; id?: string; role?: string; name?: string };
            if (!roles.includes(String(decoded.role ?? ""))) {
                return res.status(403).json({ message: USER_MESSAGE.UNAUTHORIZED });
            }
            req.user = {
                id: String(decoded._id ?? decoded.id ?? ""),
                role: String(decoded.role ?? ""),
                name: String(decoded.name ?? ""),
            };
            next();
        });
    };
}

export const loginValidator = validate(checkSchema({
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
    },
    password: {
        notEmpty: {
            errorMessage: USER_MESSAGE.PASSWORD_REQUIRED,
        },
    },
}, ["body"]));

export const registerValidator = validate(checkSchema({
    name: {
        notEmpty: {
            errorMessage: USER_MESSAGE.NAME_REQUIRED,
        },
        isLength: {
            options: { min: 2, max: 50 },
            errorMessage: USER_MESSAGE.NAME_LENGTH,
        },
        trim: true,
    },
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
        custom: {
            options: async (value: string) => {
                const user = await userModel.findOne({ email: value });
                if (user) {
                    throw new Error(USER_MESSAGE.EMAIL_ALREADY_EXISTS);
                }
                return true;
            },
        },
    },
    password: {
        notEmpty: {
            errorMessage: USER_MESSAGE.PASSWORD_REQUIRED,
        },
        isLength: {
            options: { min: 6 },
            errorMessage: USER_MESSAGE.PASSWORD_MIN_LENGTH,
        },
        matches: {
            options: /[A-Z]/,
            errorMessage: USER_MESSAGE.PASSWORD_UPPERCASE,
        },
        custom: {
            options: (value: string) => {
                if (!/[0-9]/.test(value)) {
                    throw new Error(USER_MESSAGE.PASSWORD_NUMBER);
                }
                return true;
            },
        },
    },
    confirm_password: {
        notEmpty: {
            errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_REQUIRED,
        },
        custom: {
            options: (value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH);
                }
                return true;
            },
        },
    },
}, ["body"]));

export const emailVerifyValidator = validate(checkSchema({
    emailVerifyToken: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_VERIFY_TOKEN_REQUIRED,
        },
        isString: {
            errorMessage: USER_MESSAGE.EMAIL_VERIFY_TOKEN_MUST_BE_STRING,
        },
        trim: true,
    },
}, ["body"]));

export const resendVerifyEmailValidator = validate(checkSchema({
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
    },
}, ["body"]));

export const forgotPasswordValidator = validate(checkSchema({
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
    },
}, ["body"]));

export const verifyOTPValidator = validate(checkSchema({
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
    },
    otp: {
        notEmpty: {
            errorMessage: USER_MESSAGE.OTP_REQUIRED,
        },
        isString: {
            errorMessage: USER_MESSAGE.OTP_MUST_BE_STRING,
        },
        isLength: {
            options: { min: 6, max: 6 },
            errorMessage: USER_MESSAGE.OTP_INVALID_FORMAT,
        },
        trim: true,
    },
}, ["body"]));

export const resetPasswordValidator = validate(checkSchema({
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
    },
    otp: {
        notEmpty: {
            errorMessage: USER_MESSAGE.OTP_REQUIRED,
        },
        isString: {
            errorMessage: USER_MESSAGE.OTP_MUST_BE_STRING,
        },
        isLength: {
            options: { min: 6, max: 6 },
            errorMessage: USER_MESSAGE.OTP_INVALID_FORMAT,
        },
        trim: true,
    },
    password: {
        notEmpty: {
            errorMessage: USER_MESSAGE.PASSWORD_REQUIRED,
        },
        isLength: {
            options: { min: 6 },
            errorMessage: USER_MESSAGE.PASSWORD_MIN_LENGTH,
        },
        matches: {
            options: /[A-Z]/,
            errorMessage: USER_MESSAGE.PASSWORD_UPPERCASE,
        },
        custom: {
            options: (value: string) => {
                if (!/[0-9]/.test(value)) {
                    throw new Error(USER_MESSAGE.PASSWORD_NUMBER);
                }
                return true;
            },
        },
    },
    confirm_password: {
        notEmpty: {
            errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_REQUIRED,
        },
        custom: {
            options: (value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH);
                }
                return true;
            },
        },
    },
}, ["body"]));
