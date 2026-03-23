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

export default mongoose.model("Job", jobSchema);
