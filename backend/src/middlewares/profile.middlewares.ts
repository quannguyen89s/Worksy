import { checkSchema } from "express-validator";
import { validate } from "../utils/validation";
import USER_MESSAGE from "../constants/userMessage";

export const updateProfileValidator = validate(checkSchema({
    name: {
        optional: true,
        isString: {
            errorMessage: USER_MESSAGE.NAME_MUST_BE_STRING,
        },
        isLength: {
            options: { min: 2, max: 50 },
            errorMessage: USER_MESSAGE.NAME_LENGTH,
        },
        trim: true,
    },
    avatar: {
        optional: true,
        isString: {
            errorMessage: USER_MESSAGE.AVATAR_MUST_BE_STRING,
        },
        isURL: {
            errorMessage: USER_MESSAGE.AVATAR_MUST_BE_URL,
        },
        trim: true,
    },
}, ["body"]));

export const changePasswordValidator = validate(checkSchema({
    currentPassword: {
        notEmpty: {
            errorMessage: USER_MESSAGE.CURRENT_PASSWORD_REQUIRED,
        },
    },
    newPassword: {
        notEmpty: {
            errorMessage: USER_MESSAGE.NEW_PASSWORD_REQUIRED,
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
    confirmNewPassword: {
        notEmpty: {
            errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_REQUIRED,
        },
        custom: {
            options: (value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH);
                }
                return true;
            },
        },
    },
}, ["body"]));
