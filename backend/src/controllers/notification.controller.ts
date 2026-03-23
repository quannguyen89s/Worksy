import { Request, Response } from "express";
import notificationService from "../services/notification.service";

export const getNotificationsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query["page"] as string | undefined) ?? "1", 10);
    const limit = parseInt((req.query["limit"] as string | undefined) ?? "20", 10);

    const result = await notificationService.getNotifications(
      req.user!.id,
      page,
      limit
    );

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};

export const getNotificationUnreadCountController = async (req: Request, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};

export const markReadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const notification = await notificationService.markRead(id, req.user!.id);

    if (!notification) {
      res.status(404).json({ success: false, message: "Không tìm thấy notification" });
      return;
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};

export const markAllReadController = async (req: Request, res: Response) => {
  try {
    await notificationService.markAllRead(req.user!.id);
    res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};

export const deleteNotificationController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = await notificationService.deleteOne(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: "Không tìm thấy notification" });
      return;
    }

    res.json({ success: true, message: "Đã xoá notification" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};
