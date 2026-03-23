import { Router } from "express";
import { authenticate } from "../middlewares/access.middleware";
import chatController from "../controllers/chat.controller";

const router = Router();

router.use(authenticate);

router.get("/unread", (req, res) =>
  chatController.getUnreadCount(req, res)
);

router.get("/conversations", (req, res) =>
  chatController.getConversations(req, res)
);

router.post("/conversations", (req, res) =>
  chatController.createConversation(req, res)
);

router.get("/conversations/:id/messages", (req, res) =>
  chatController.getMessages(req, res)
);

router.post("/conversations/:id/read", (req, res) =>
  chatController.markRead(req, res)
);

router.post("/conversations/:id/image", (req, res) =>
  chatController.sendImage(req, res)
);

export default router;
