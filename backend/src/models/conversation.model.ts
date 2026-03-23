import mongoose, { Schema, Types } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: [
      { type: Types.ObjectId, ref: "User", required: true },
    ],
    jobId: { type: Types.ObjectId, ref: "Job", default: null },
    lastMessage: { type: Types.ObjectId, ref: "Message", default: null },
    lastMessageAt: { type: Date, default: null },
    // Map<userId, unreadCount>
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
