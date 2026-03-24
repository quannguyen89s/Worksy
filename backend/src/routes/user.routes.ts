import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware";
import userModel from "../models/user.model";
import { Role } from "../constants/enum";

const router = Router();

/**
 * Danh sách thợ (worker) cho khách xem — đã đăng nhập, không lộ email.
 * Query: limit (1–50), search (tìm theo tên hoặc skill)
 */
router.get("/workers", requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter: Record<string, unknown> = {
      role: Role.Worker,
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
      ];
    }

    const items = await userModel
      .find(filter)
      .select("_id name rating completedJobs skills avatar")
      .sort({ rating: -1, completedJobs: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      items: items.map((u) => ({
        _id: String(u._id),
        name: u.name,
        rating: u.rating ?? 0,
        completedJobs: u.completedJobs ?? 0,
        skills: Array.isArray(u.skills) ? u.skills : [],
        avatar: u.avatar ?? "",
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
  }
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await userModel
      .findById(req.user!.id)
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
