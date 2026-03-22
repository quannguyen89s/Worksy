import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { checkSchema } from "express-validator";
import userModel from "../models/user.model";
import { validate } from "../utils/validation";
import USER_MESSAGE from "../constants/userMessage";

const loginValidator = checkSchema({
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
        isLength: {
            options: { min: 6 },
            errorMessage: USER_MESSAGE.PASSWORD_MIN_LENGTH,
        },
        matches: {
            options: /[A-Z]/,
            errorMessage: USER_MESSAGE.PASSWORD_UPPERCASE,
        },
    },
}, ["body"]);

const registerValidator = checkSchema({
    name: {
        notEmpty: {
            errorMessage: USER_MESSAGE.NAME_REQUIRED,
        },
        isLength: {
            options: { min: 2, max: 50 },
            errorMessage: USER_MESSAGE.NAME_LENGTH,
        },
        trim: true,
        custom: {
            options: async (value: string) => {
                const user = await userModel.findOne({ name: value });
                if (user) {
                    throw new Error(USER_MESSAGE.NAME_ALREADY_EXISTS);
                }
                return true;
            },
        },
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
}, ["body"]);

export const loginMiddleware = validate(loginValidator);
export const registerMiddleware = validate(registerValidator);

const emailVerifyValidator = checkSchema({
    emailVerifyToken: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_VERIFY_TOKEN_REQUIRED,
        },
        isString: {
            errorMessage: USER_MESSAGE.EMAIL_VERIFY_TOKEN_MUST_BE_STRING,
        },
        trim: true,
    },
}, ["body"]);

export const verifyEmailMiddleware = validate(emailVerifyValidator);

const resendVerifyEmailValidator = checkSchema({
    email: {
        notEmpty: {
            errorMessage: USER_MESSAGE.EMAIL_REQUIRED,
        },
        isEmail: {
            errorMessage: USER_MESSAGE.EMAIL_INVALID,
        },
        trim: true,
    },
}, ["body"]);

export const resendVerifyEmailMiddleware = validate(resendVerifyEmailValidator);

