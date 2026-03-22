import Conversation from "../models/conversation.model";
import Message from "../models/message.model";

class ChatService {
  async getOrCreateConversation(
    userId1: string,
    userId2: string,
    jobId?: string
  ) {
    const sorted = [userId1, userId2].sort();

    const query: Record<string, unknown> = {
      participants: { $all: sorted, $size: 2 },
    };
    if (jobId) query["jobId"] = jobId;

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: sorted,
        jobId: jobId ?? null,
      });
    }

    return conversation;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: "text" | "image" | "file" = "text"
  ) {
    const message = await Message.create({
      conversationId,
      senderId,
      content,
      type,
    });

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const unreadMap =
        (conversation.get("unreadCount") as Map<string, number> | undefined) ??
        new Map<string, number>();

      for (const participantId of conversation.participants as unknown as string[]) {
        if (participantId.toString() !== senderId) {
          const prev = unreadMap.get(participantId.toString()) ?? 0;
          unreadMap.set(participantId.toString(), prev + 1);
        }
      }

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
        unreadCount: unreadMap,
      });
    }

    const populated = await message.populate("senderId", "name avatar");
    return populated.toObject();
  }

  async getConversations(userId: string) {
    return Conversation.find({ participants: userId })
      .populate("participants", "name avatar role")
      .populate("lastMessage")
      .populate("jobId", "title status")
      .sort({ lastMessageAt: -1 });
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversationId })
      .populate("senderId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return messages.reverse().map((m) => m.toObject());
  }

  async markMessagesRead(conversationId: string, userId: string) {
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const unreadMap =
        (conversation.get("unreadCount") as Map<string, number> | undefined) ??
        new Map<string, number>();
      unreadMap.set(userId, 0);
      await Conversation.findByIdAndUpdate(conversationId, {
        unreadCount: unreadMap,
      });
    }
  }

  async getTotalUnread(userId: string): Promise<number> {
    const conversations = await Conversation.find({ participants: userId });
    let total = 0;
    for (const conv of conversations) {
      const unreadMap = conv.get("unreadCount") as
        | Map<string, number>
        | undefined;
      if (unreadMap) {
        total += unreadMap.get(userId) ?? 0;
      }
    }
    return total;
  }

  async getConversationWithParticipants(conversationId: string) {
    return Conversation.findById(conversationId).populate(
      "participants",
      "_id name avatar"
    );
  }
}

export default new ChatService();
