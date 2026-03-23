import { Router } from "express";
import {
  getConversationsController,
  createConversationController,
  getMessagesController,
  markReadController,
  sendImageController,
  getUnreadCountController,
} from "../controllers/chat.controller";
import { requireAuth } from "../middlewares/requireAuth.middleware";

const chatRouter = Router();

chatRouter.get("/unread", requireAuth, getUnreadCountController);
chatRouter.get("/conversations", requireAuth, getConversationsController);
chatRouter.post("/conversations", requireAuth, createConversationController);
chatRouter.get("/conversations/:id/messages", requireAuth, getMessagesController);
chatRouter.post("/conversations/:id/read", requireAuth, markReadController);
chatRouter.post("/conversations/:id/image", requireAuth, sendImageController);

export default chatRouter;
