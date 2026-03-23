import userModel from "../models/user.model";
import { AppError } from "../utils/AppError";
import HTTP_STATUS from "../constants/httpStatus";
import USER_MESSAGE from "../constants/userMessage";
import bcrypt from "bcryptjs";

export const getProfileService = async (userId: string) => {
    const user = await userModel.findById(userId).select("-password -refreshToken -emailVerifyToken -forgotPasswordOTP -forgotPasswordOTPExpiry -__v");
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return user;
};

export const updateProfileService = async (userId: string, updateData: { name?: string; avatar?: string }) => {
    const user = await userModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken -emailVerifyToken -forgotPasswordOTP -forgotPasswordOTPExpiry -__v");

    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return user;
};

export const changePasswordService = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new AppError(USER_MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new AppError(USER_MESSAGE.CURRENT_PASSWORD_WRONG, HTTP_STATUS.BAD_REQUEST);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
        throw new AppError(USER_MESSAGE.NEW_PASSWORD_SAME_AS_OLD, HTTP_STATUS.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updateOne({ _id: userId }, { password: hashedPassword });

    return { message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESSFUL };
};
