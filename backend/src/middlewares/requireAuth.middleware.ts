import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";

const getBearerToken = (req: Request): string | null => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }
    const secret = process.env.JWT_SECRET_ACCESS_TOKEN;
    if (!secret) {
      throw new AppError("Server misconfiguration", 500);
    }
    const decoded = jwt.verify(token, secret) as {
      _id?: string;
      sub?: string;
      id?: string;
      role?: string;
      name?: string;
    };
    // hỗ trợ cả token cũ { id } lẫn token mới { _id, sub }
    const id = decoded._id ?? decoded.sub ?? decoded.id;
    if (!id) {
      throw new AppError("Unauthorized", 401);
    }
    req.user = {
      id: String(id),
      role: String(decoded.role ?? ""),
      name: String(decoded.name ?? ""),
    };
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}
