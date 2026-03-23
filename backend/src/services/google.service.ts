import { OAuth2Client } from "google-auth-library";
import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import USER_MESSAGE from "../constants/userMessage";
import HTTP_STATUS from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

export const googleLoginService = async (idToken: string) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new AppError("Invalid Google token", HTTP_STATUS.UNAUTHORIZED);
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await userModel.findOne({
        $or: [{ googleId }, { email }]
    });

    if (!user) {
        const user_id = new ObjectId();
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

        user = await userModel.create({
            _id: user_id,
            name: name || "Google User",
            email,
            password: randomPassword,
            googleId,
            avatar: picture || "",
            isVerified: true,
            isDeleted: false,
        });
    } else if (!user.googleId) {
        await userModel.updateOne(
            { _id: user._id },
            { googleId, isVerified: true, avatar: user.avatar || picture || "" }
        );
    }

    if (user.isDeleted) {
        throw new AppError("User account has been deleted", HTTP_STATUS.FORBIDDEN);
    }

    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user._id.toString(), user.role),
        signRefreshToken(user._id.toString(), user.role),
    ]);

    await userModel.updateOne({ _id: user._id }, { refreshToken });

    return { message: USER_MESSAGE.GOOGLE_LOGIN_SUCCESSFUL, accessToken, refreshToken };
}