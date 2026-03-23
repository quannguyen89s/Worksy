import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/access.middleware";
import notificationService from "../services/notification.service";

const authUser = (req: Request) => (req as unknown as AuthRequest).user;

class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query["page"] as string | undefined) ?? "1", 10);
      const limit = parseInt((req.query["limit"] as string | undefined) ?? "20", 10);

      const result = await notificationService.getNotifications(
        authUser(req).id,
        page,
        limit
      );

      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(authUser(req).id);
      res.json({ success: true, unreadCount: count });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const notification = await notificationService.markRead(id, authUser(req).id);

      if (!notification) {
        res.status(404).json({ success: false, message: "Không tìm thấy notification" });
        return;
      }

      res.json({ success: true, notification });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      await notificationService.markAllRead(authUser(req).id);
      res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const deleted = await notificationService.deleteOne(id, authUser(req).id);

      if (!deleted) {
        res.status(404).json({ success: false, message: "Không tìm thấy notification" });
        return;
      }

      res.json({ success: true, message: "Đã xoá notification" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }
}

export default new NotificationController();
