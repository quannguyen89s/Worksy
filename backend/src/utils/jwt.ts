import jwt from "jsonwebtoken";

export const signAccessToken = (userId: string, role: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId, role }, process.env.JWT_SECRET_ACCESS_TOKEN!, { expiresIn: "1h" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}

export const signRefreshToken = (userId: string, role: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId, role }, process.env.JWT_SECRET_REFRESH_TOKEN!, { expiresIn: "7d" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}

export const signEmailVerifyToken = (userId: string) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign({ _id: userId }, process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN!, { expiresIn: "1d" }, (err, token) => {
            if (err) reject(err);
            resolve(token as string);
        });
    });
}
