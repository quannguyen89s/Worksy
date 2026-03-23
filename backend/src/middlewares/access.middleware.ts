import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export type AuthRequest = Request & {
  user: { id: string; role: string };
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: "Không có token xác thực" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_ACCESS_TOKEN!
    ) as JwtPayload & { _id: string; role?: string };

    (req as AuthRequest).user = {
      id: decoded._id,
      role: decoded.role ?? "",
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
