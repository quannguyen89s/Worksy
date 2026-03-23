import { checkSchema, type Meta } from "express-validator";
import userModel from "../models/user.model";
import { validate } from "../utils/validation";

const loginValidator = checkSchema({
    email: {
        notEmpty: {
            errorMessage: "Email không được để trống",
        },
        isEmail: {
            errorMessage: "Email không hợp lệ",
        },
        trim: true,
    },
    password: {
        notEmpty: {
            errorMessage: "Mật khẩu không được để trống",
        },
        isLength: {
            options: { min: 6 },
            errorMessage: "Mật khẩu phải có ít nhất 6 ký tự",
        },
        matches: {
            options: /[A-Z]/,
            errorMessage: "Mật khẩu phải có ít nhất 1 chữ viết hoa",
        },
    },
}, ["body"]);

const registerValidator = checkSchema({
    name: {
        notEmpty: {
            errorMessage: "Tên không được để trống",
        },
        isLength: {
            options: { min: 2, max: 50 },
            errorMessage: "Tên phải từ 2 đến 50 ký tự",
        },
        trim: true,
        custom: {
            options: async (value: string) => {
                const user = await userModel.findOne({ name: value });
                if (user) {
                    throw new Error("Tên đã tồn tại");
                }
                return true;
            },
        },
    },
    email: {
        notEmpty: {
            errorMessage: "Email không được để trống",
        },
        isEmail: {
            errorMessage: "Email không hợp lệ",
        },
        trim: true,
        custom: {
            options: async (value: string) => {
                const user = await userModel.findOne({ email: value });
                if (user) {
                    throw new Error("Email đã tồn tại");
                }
                return true;
            },
        },
    },
    password: {
        notEmpty: {
            errorMessage: "Mật khẩu không được để trống",
        },
        isLength: {
            options: { min: 6 },
            errorMessage: "Mật khẩu phải có ít nhất 6 ký tự",
        },
        matches: {
            options: /[A-Z]/,
            errorMessage: "Mật khẩu phải có ít nhất 1 chữ viết hoa",
        },
        custom: {
            options: (value: string) => {
                if (!/[0-9]/.test(value)) {
                    throw new Error("Mật khẩu phải có ít nhất 1 chữ số");
                }
                return true;
            },
        },
    },
    confirm_password: {
        notEmpty: {
            errorMessage: "Xác nhận mật khẩu không được để trống",
        },
        custom: {
            options: (value: unknown, { req }: Meta) => {
                if (value !== req.body.password) {
                    throw new Error("Xác nhận mật khẩu không khớp");
                }
                return true;
            },
        },
    },
}, ["body"]);

export const loginMiddleware = validate(loginValidator);
export const registerMiddleware = validate(registerValidator);