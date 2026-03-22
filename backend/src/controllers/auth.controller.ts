import { Request, Response } from "express";
import { loginService, registerService } from "../services/auth.service";
import { LoginRequestBody, RegisterRequestBody } from "../models/request/user.request";
import { ParamsDictionary } from "express-serve-static-core";

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginService(email, password);
        return res.status(200).json({ message: "Login successful", result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
    try {
        const { name, email, password, confirm_password } = req.body;
        const result = await registerService(name, email, password, confirm_password);
        return res.status(200).json({ message: "Register successful", result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
