import { Router } from "express";
import { authenticate } from "../middlewares/access.middleware";
import notificationController from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);


router.get("/", (req, res) =>
  notificationController.getNotifications(req, res)
);


router.get("/unread-count", (req, res) =>
  notificationController.getUnreadCount(req, res)
);


router.patch("/read-all", (req, res) =>
  notificationController.markAllRead(req, res)
);


router.patch("/:id/read", (req, res) =>
  notificationController.markRead(req, res)
);


router.delete("/:id", (req, res) =>
  notificationController.deleteNotification(req, res)
);

export default router;
