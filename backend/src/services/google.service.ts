import { OAuth2Client } from "google-auth-library";
import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import HTTP_STATUS from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import USER_MESSAGE from "../constants/userMessage";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

/** Các client ID được phép làm `aud` của id_token (Web + iOS + Android). */
function googleTokenAudiences(): string[] {
    const ids = [
        process.env.GOOGLE_WEB_CLIENT_ID,
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_IOS_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter((v): v is string => Boolean(v && v.trim()));
    return [...new Set(ids)];
}

/**
 * Tìm / tạo user từ Google profile, cấp JWT (dùng chung cho OAuth redirect + mobile idToken).
 */
export async function upsertGoogleUserAndIssueTokens(
    googleId: string,
    email: string,
    name?: string,
    picture?: string,
) {
    let user = await userModel.findOne({
        $or: [{ googleId }, { email }],
    });

    if (user?.isDeleted) {
        throw new AppError("Tài khoản đã bị xóa", HTTP_STATUS.FORBIDDEN);
    }

    if (!user) {
        const user_id = new ObjectId();
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
        await userModel.create({
            _id: user_id,
            name: name || "Google User",
            email,
            password: randomPassword,
            googleId,
            avatar: picture || "",
            isVerified: true,
            isDeleted: false,
        });
        user = await userModel.findById(user_id);
    } else if (!user.googleId) {
        await userModel.updateOne(
            { _id: user._id },
            { $set: { googleId, isVerified: true, avatar: user.avatar || picture || "" } },
        );
        user = await userModel.findById(user._id);
    }

    const fresh = user;
    if (!fresh) {
        throw new AppError("Không tải được người dùng sau đăng nhập Google", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(fresh._id.toString(), fresh.role),
        signRefreshToken(fresh._id.toString(), fresh.role),
    ]);

    await userModel.updateOne({ _id: fresh._id }, { refreshToken });

    return {
        message: USER_MESSAGE.GOOGLE_LOGIN_SUCCESSFUL,
        accessToken,
        refreshToken,
        user: {
            _id: fresh._id.toString(),
            name: fresh.name,
            email: fresh.email,
            role: fresh.role,
            avatar: fresh.avatar ?? null,
        },
    };
}

/** Mobile / Expo: xác thực id_token bằng google-auth-library, không dùng redirect localhost. */
export async function loginWithGoogleIdToken(idToken: string) {
    const audiences = googleTokenAudiences();
    if (audiences.length === 0) {
        throw new AppError("Chưa cấu hình Google OAuth (GOOGLE_*_CLIENT_ID)", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const client = new OAuth2Client();
    const audience: string | string[] = audiences.length === 1 ? audiences[0]! : audiences;
    const ticket = await client.verifyIdToken({
        idToken,
        audience,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
        throw new AppError("Google id_token không hợp lệ", HTTP_STATUS.UNAUTHORIZED);
    }

    return upsertGoogleUserAndIssueTokens(
        payload.sub,
        payload.email,
        payload.name ?? undefined,
        payload.picture ?? undefined,
    );
}

/** Web OAuth redirect: URL đăng nhập Google (callback về backend). */
export const getGoogleAuthURL = (callbackUrl: string, returnUrl: string) => {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
    return client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "profile", "email"],
        prompt: "select_account",
        state: returnUrl,
    });
};

/** Web OAuth redirect: đổi code → id_token → user + JWT. */
export const googleCallbackService = async (code: string, callbackUrl: string) => {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
        throw new AppError("Failed to get ID token from Google", HTTP_STATUS.UNAUTHORIZED);
    }

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new AppError("Invalid Google token", HTTP_STATUS.UNAUTHORIZED);
    }

    const { sub: googleId, email, name, picture } = payload;
    const out = await upsertGoogleUserAndIssueTokens(googleId, email, name, picture);
    return { accessToken: out.accessToken, refreshToken: out.refreshToken };
};
