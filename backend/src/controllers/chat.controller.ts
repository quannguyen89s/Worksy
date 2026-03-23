import { Request, Response } from "express";
import chatService from "../services/chat.service";
import { getIO } from "../socket/socket";

export const getConversationsController = async (req: Request, res: Response) => {
  try {
    const conversations = await chatService.getConversations(req.user!.id);
    res.json({ success: true, conversations });
  } catch (error) {
    console.error("[ChatController] getConversations error:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
  }
};

export const createConversationController = async (req: Request, res: Response) => {
  try {
    const { recipientId, jobId } = req.body as {
      recipientId?: string;
      jobId?: string;
    };

    if (!recipientId) {
      res.status(400).json({ success: false, message: "recipientId là bắt buộc" });
      return;
    }

    if (recipientId === req.user!.id) {
      res.status(400).json({ success: false, message: "Không thể chat với chính mình" });
      return;
    }

    const conversation = await chatService.getOrCreateConversation(
      req.user!.id,
      recipientId,
      jobId
    );

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};

export const getMessagesController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const page = parseInt((req.query["page"] as string | undefined) ?? "1", 10);
    const messages = await chatService.getMessages(id, page);
    res.json({ success: true, messages, page });
  } catch (error) {
    console.error("[ChatController] getMessages error:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
  }
};

export const markReadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await chatService.markMessagesRead(id, req.user!.id);
    res.json({ success: true, message: "Đã đánh dấu đọc" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};

export const sendImageController = async (req: Request, res: Response) => {
  try {
    const { id: conversationId } = req.params as { id: string };
    const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };

    if (!imageBase64) {
      res.status(400).json({ success: false, message: "imageBase64 là bắt buộc" });
      return;
    }

    const dataUri = `data:${mimeType ?? "image/jpeg"};base64,${imageBase64}`;
    const message = await chatService.sendMessage(conversationId, req.user!.id, dataUri, "image");

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
      // socket emit is best-effort
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("[ChatController] sendImage error:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: String(error) });
  }
};

export const getUnreadCountController = async (req: Request, res: Response) => {
  try {
    const count = await chatService.getTotalUnread(req.user!.id);
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error });
  }
};
