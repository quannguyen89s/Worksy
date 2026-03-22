import { Request, Response } from "express";
import * as authService from "../services/auth.service";

class AuthController {
  /**
   * POST /auth/login
   * Body: { "email": "...", "password": "..." }
   * Trả về JWT để dùng trong header: Authorization: Bearer <token>
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "email và password là bắt buộc",
        });
        return;
      }

      const result = await authService.loginWithEmailPassword(email, password);

      if (!result) {
        res.status(401).json({
          success: false,
          message: "Sai email hoặc mật khẩu",
        });
        return;
      }

      res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }
}

export default new AuthController();
