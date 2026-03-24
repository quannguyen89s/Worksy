import { Request, Response } from "express";
import { getProfileService, updateProfileService, changePasswordService } from "../services/profile.service";
import HTTP_STATUS from "../constants/httpStatus";
import userModel from "../models/user.model";

const handleError = (error: any, res: Response) => {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
};

export const getProfileController = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const profile = await getProfileService(userId);
        return res.status(HTTP_STATUS.OK).json({ message: "Get profile successful", result: profile });
    } catch (error) {
        return handleError(error, res);
    }
};

export const updateProfileController = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { name, avatar } = req.body;

        const updateData: { name?: string; avatar?: string } = {};
        if (name !== undefined) updateData.name = name;
        if (avatar !== undefined) updateData.avatar = avatar;

        const profile = await updateProfileService(userId, updateData);
        return res.status(HTTP_STATUS.OK).json({ message: "Update profile successful", result: profile });
    } catch (error) {
        return handleError(error, res);
    }
};

export const changePasswordController = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;
        const result = await changePasswordService(userId, currentPassword, newPassword);
        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        return handleError(error, res);
    }
};

export const uploadAvatarController = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        if (!req.file) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "No file uploaded" });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;
        await userModel.updateOne({ _id: userId }, { avatar: avatarUrl });

        return res.status(HTTP_STATUS.OK).json({
            message: "Upload avatar successful",
            result: { avatar: avatarUrl },
        });
    } catch (error) {
        return handleError(error, res);
    }
};
