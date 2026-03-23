import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middlewares/access.middleware";
import userModel from "../models/user.model";

const router = Router();

router.get("/me", authenticate, async (req, res: Response) => {
  try {
    const user = await userModel
      .findById((req as AuthRequest).user.id)
      .select("_id name email role avatar");

    if (!user) {
      res.status(404).json({ success: false, message: "Không tìm thấy user" });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
  }
});

export default router;
