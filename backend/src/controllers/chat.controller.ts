import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/access.middleware";
import chatService from "../services/chat.service";
import { getIO } from "../socket/socket";

const authUser = (req: Request) => (req as unknown as AuthRequest).user;

class ChatController {
  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = await chatService.getConversations(authUser(req).id);
      res.json({ success: true, conversations });
    } catch (error) {
      console.error("[ChatController] getConversations error:", error);
      res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
    }
  }

  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, jobId } = req.body as {
        recipientId?: string;
        jobId?: string;
      };

      if (!recipientId) {
        res.status(400).json({ success: false, message: "recipientId là bắt buộc" });
        return;
      }

      const currentUserId = authUser(req).id;

      if (recipientId === currentUserId) {
        res.status(400).json({ success: false, message: "Không thể chat với chính mình" });
        return;
      }

      const conversation = await chatService.getOrCreateConversation(
        currentUserId,
        recipientId,
        jobId
      );

      res.status(201).json({ success: true, conversation });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const page = parseInt((req.query["page"] as string | undefined) ?? "1", 10);
      const messages = await chatService.getMessages(id, page);
      res.json({ success: true, messages, page });
    } catch (error) {
      console.error("[ChatController] getMessages error:", error);
      res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
    }
  }

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await chatService.markMessagesRead(id, authUser(req).id);
      res.json({ success: true, message: "Đã đánh dấu đọc" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }

  async sendImage(req: Request, res: Response): Promise<void> {
    try {
      const { id: conversationId } = req.params as { id: string };
      const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };

      if (!imageBase64) {
        res.status(400).json({ success: false, message: "imageBase64 là bắt buộc" });
        return;
      }

      const dataUri = `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`;
      const message = await chatService.sendMessage(conversationId, authUser(req).id, dataUri, "image");

      try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit("new_message", message);

        const conv = await chatService.getConversationWithParticipants(conversationId);
        if (conv) {
          const participants = conv.participants as unknown as Array<{ _id: { toString(): string } }>;
          for (const p of participants) {
            io.to(`user:${p._id.toString()}`).emit("conversation_updated", {
              conversationId,
              message,
            });
          }
        }
      } catch {
      }

      res.status(201).json({ success: true, message });
    } catch (error) {
      console.error("[ChatController] sendImage error:", error);
      res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await chatService.getTotalUnread(authUser(req).id);
      res.json({ success: true, unreadCount: count });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server", error });
    }
  }
}

export default new ChatController();
