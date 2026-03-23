import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    skillTags: {
      type: [String],
      default: [],
    },
    requiredWorkers: {
      type: Number,
      required: true,
      min: 1,
    },
    assignedWorkers: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignedWorkerIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "open", "full", "done"],
      default: "pending",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionDueAt: {
      type: Date,
      default: null,
    },
    completionSource: {
      type: String,
      enum: ["manual", "auto"],
      default: null,
    },
    autoDoneAfterHours: {
      type: Number,
      min: 1,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

jobSchema.index({ status: 1, completionDueAt: 1 });

export default mongoose.model("Job", jobSchema);
