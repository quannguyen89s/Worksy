import mongoose, { Schema, Types } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: { type: Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
