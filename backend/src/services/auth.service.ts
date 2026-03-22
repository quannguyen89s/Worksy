import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
export const loginService = async (email: string, password: string) => {

    const user = await userModel.findOne({ email });
    if (!user) {
        return { message: "User not found" };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return { message: "Invalid password" };
    }
    const accessToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_ACCESS_TOKEN!, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_REFRESH_TOKEN!, { expiresIn: "7d" });
    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
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
    const user_id = new ObjectId()

    const emailVerifyToken = jwt.sign({ _id: user_id.toString() }, process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!, { expiresIn: "1d" });
    await userModel.create({ _id: user_id, name, email, password: hashedPassword, emailVerifyToken });

    return { emailVerifyToken };
}
