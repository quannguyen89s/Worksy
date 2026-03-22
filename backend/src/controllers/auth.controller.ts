import { Request, Response } from "express";
import { loginService, registerService } from "../services/auth.service";

export const loginController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await loginService(email, password);
        return res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const registerController = async (req: Request, res: Response) => {
    try {
        const { name, email, password, confirm_password } = req.body;
        const user = await registerService(name, email, password, confirm_password);
        return res.status(200).json({ message: "Register successful", user });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
