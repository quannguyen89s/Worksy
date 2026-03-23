import { Router } from "express";
import {
  getNotificationsController,
  getNotificationUnreadCountController,
  markReadController,
  markAllReadController,
  deleteNotificationController,
} from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/requireAuth.middleware";

const notificationRouter = Router();

notificationRouter.get("/", requireAuth, getNotificationsController);
notificationRouter.get("/unread-count", requireAuth, getNotificationUnreadCountController);
notificationRouter.patch("/read-all", requireAuth, markAllReadController);
notificationRouter.patch("/:id/read", requireAuth, markReadController);
notificationRouter.delete("/:id", requireAuth, deleteNotificationController);

export default notificationRouter;
