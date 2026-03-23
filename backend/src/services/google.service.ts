import { OAuth2Client } from "google-auth-library";
import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import HTTP_STATUS from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const getGoogleAuthURL = (callbackUrl: string, returnUrl: string) => {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
    return client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "profile", "email"],
        prompt: "select_account",
        state: returnUrl,
    });
};

export const googleCallbackService = async (code: string, callbackUrl: string) => {
    console.log('📥 Step 1: Exchanging code for tokens...');
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);
    const { tokens } = await client.getToken(code);
    console.log('✅ Step 1 done: Got tokens');

    if (!tokens.id_token) {
        throw new AppError("Failed to get ID token from Google", HTTP_STATUS.UNAUTHORIZED);
    }

    console.log('📥 Step 2: Verifying id_token...');
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new AppError("Invalid Google token", HTTP_STATUS.UNAUTHORIZED);
    }
    console.log('✅ Step 2 done: User email =', payload.email);

    const { sub: googleId, email, name, picture } = payload;

    console.log('📥 Step 3: Finding/creating user...');
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
        });
        console.log('✅ Step 3 done: Created new user');
    } else if (!user.googleId) {
        await userModel.updateOne(
            { _id: user._id },
            { googleId, isVerified: true, avatar: user.avatar || picture || "" }
        );
        console.log('✅ Step 3 done: Updated existing user with googleId');
    } else {
        console.log('✅ Step 3 done: User already exists');
    }

    console.log('📥 Step 4: Creating JWT tokens...');
    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user._id.toString(), user.role),
        signRefreshToken(user._id.toString(), user.role),
    ]);

    await userModel.updateOne({ _id: user._id }, { refreshToken });
    console.log('✅ Step 4 done: JWT created, redirecting...');

    return { accessToken, refreshToken };
};