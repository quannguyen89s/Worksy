import Notification, { NotificationType } from "../models/notification.model";

class NotificationService {
  /** Tạo notification mới và trả về document vừa tạo. */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {}
  ) {
    return Notification.create({ userId, type, title, body, data });
  }

  /** Lấy danh sách notification của user với phân trang. */
  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Đánh dấu một notification là đã đọc. */
  async markRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  /** Đánh dấu tất cả notification của user là đã đọc. */
  async markAllRead(userId: string) {
    return Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /** Đếm số notification chưa đọc. */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, isRead: false });
  }

  /** Xoá một notification. */
  async deleteOne(notificationId: string, userId: string) {
    return Notification.findOneAndDelete({ _id: notificationId, userId });
  }
}

export default new NotificationService();
