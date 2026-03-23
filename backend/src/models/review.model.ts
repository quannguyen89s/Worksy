import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

reviewSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
