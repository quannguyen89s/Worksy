// Mở rộng kiểu Request của Express để thêm property 'user'
// Cho phép sử dụng req.user trong middleware mà không bị lỗi TypeScript

import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload; // Kết quả từ jwt.verify() có thể là string hoặc JwtPayload
    }
  }
}
