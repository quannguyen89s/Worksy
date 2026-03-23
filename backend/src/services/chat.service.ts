import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import applicationModel from "../models/application.model";
import jobModel from "../models/job.model";

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

    let conversation = await Conversation.findOne(query);
    let created = false;

    if (!conversation) {
      conversation = await Conversation.create({
        participants: sorted,
        jobId: jobId ?? null,
      });
      created = true;
    } else if (jobId && !conversation.jobId) {
      // Keep first linked job for legacy conversations without jobId.
      conversation.set("jobId", jobId);
      await conversation.save();
    }

    return { conversation, created };
  }

  async sendIntroMessage(
    conversationId: string,
    senderId: string,
    jobTitle?: string
  ) {
    const title = (jobTitle ?? "").trim();
    const content = title
      ? `Hai bên đã được kết nối qua công việc: ${title}`
      : "Hai bên đã được kết nối để trao đổi công việc.";
    return this.sendMessage(conversationId, senderId, content, "text");
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
    await this.ensureConversationsForUser(userId);
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name avatar role")
      .populate("lastMessage")
      .populate("jobId", "title status")
      .sort({ lastMessageAt: -1 });

    // Show only one thread per user pair (latest one wins).
    const seenPairs = new Set<string>();
    const deduped: typeof conversations = [];
    for (const conv of conversations) {
      const participants = conv.participants as unknown as Array<{ _id?: unknown; id?: unknown }>;
      const otherIds = participants
        .map((p) => String(p?._id ?? p?.id ?? ""))
        .filter((id) => id && id !== userId)
        .sort();
      const pairKey = otherIds.join("|") || String(conv._id);
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      deduped.push(conv);
    }
    return deduped;
  }

  private async ensureConversationsForUser(userId: string) {
    const pendingOrAccepted = { $in: ["pending", "accepted"] };

    // Worker side: user applied to jobs of customers.
    const myApplies = await applicationModel
      .find({ workerId: userId, status: pendingOrAccepted })
      .select("jobId workerId")
      .populate("jobId", "_id createdBy title")
      .lean();

    for (const row of myApplies) {
      const job = row.jobId as unknown as { _id?: unknown; createdBy?: unknown; title?: string };
      if (!job?._id || !job?.createdBy) continue;
      const { conversation, created } = await this.getOrCreateConversation(
        String(row.workerId),
        String(job.createdBy),
        String(job._id),
      );
      if (created) {
        await this.sendIntroMessage(String(conversation._id), String(row.workerId), job.title);
      }
    }

    // Customer side: user's jobs have applicants.
    const myJobs = await jobModel.find({ createdBy: userId }).select("_id title").lean();
    if (!myJobs.length) return;

    const jobIdToTitle = new Map(myJobs.map((j) => [String(j._id), j.title]));
    const jobIds = myJobs.map((j) => j._id);
    const jobApplies = await applicationModel
      .find({ jobId: { $in: jobIds }, status: pendingOrAccepted })
      .select("jobId workerId")
      .lean();

    for (const row of jobApplies) {
      const jId = String(row.jobId);
      const title = jobIdToTitle.get(jId);
      const { conversation, created } = await this.getOrCreateConversation(
        userId,
        String(row.workerId),
        jId,
      );
      if (created) {
        await this.sendIntroMessage(String(conversation._id), userId, title);
      }
    }
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
