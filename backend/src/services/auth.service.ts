import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginService = async (email: string, password: string) => {

    const user = await userModel.findOne({ email });
    if (!user) {
        return { message: "User not found" };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { message: "Invalid password" };
    }
    const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    user.refreshToken = refreshToken;
    await user.save();

    return { message: "Login successful", user, accessToken, refreshToken };
}

export const registerService = async (name: string, email: string, password: string, confirm_password: string) => {
    const user = await userModel.findOne({ email });
    if (user) {
        return { message: "User already exists" };
    }
    if (password !== confirm_password) {
        return { message: "Password does not match" };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({ name, email, password: hashedPassword });

    const accessToken = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    const EmailVerifyToken = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    await userModel.updateOne({ _id: newUser._id }, { refreshToken, EmailVerifyToken });

    return { message: "Register successful", user: newUser, accessToken, refreshToken };
}
