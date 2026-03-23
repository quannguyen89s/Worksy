import mongoose from "mongoose";
import jobModel from "../models/job.model";
import reviewModel from "../models/review.model";
import userModel from "../models/user.model";
import { AppError } from "../utils/AppError";

function assertValidJobId(jobId: string) {
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError("Job not found", 404);
  }
}

export async function listReviewsForCustomerJob(
  customerId: string,
  jobId: string,
) {
  assertValidJobId(jobId);
  const job = await jobModel.findById(jobId).lean();
  if (!job) throw new AppError("Job not found", 404);
  if (job.isDeleted) throw new AppError("Job not found", 404);
  if (String(job.createdBy) !== customerId) {
    throw new AppError("Forbidden", 403);
  }
  return reviewModel
    .find({ jobId })
    .select("workerId rating comment createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createReview(
  customerId: string,
  body: {
    jobId: string;
    workerId: string;
    rating: number;
    comment?: string;
  },
) {
  assertValidJobId(body.jobId);
  if (!body.workerId || !mongoose.Types.ObjectId.isValid(body.workerId)) {
    throw new AppError("Invalid worker", 400);
  }
  const job = await jobModel.findById(body.jobId).lean();
  if (!job) throw new AppError("Job not found", 404);
  if (job.status !== "done") {
    throw new AppError("Job must be completed before review", 400);
  }
  if (String(job.createdBy) !== customerId) {
    throw new AppError("Forbidden", 403);
  }
  const assigned = (job.assignedWorkerIds ?? []).map(String);
  if (!assigned.includes(String(body.workerId))) {
    throw new AppError("Worker was not assigned to this job", 400);
  }
  try {
    const doc = await reviewModel.create({
      jobId: body.jobId,
      workerId: body.workerId,
      customerId,
      rating: body.rating,
      ...(body.comment != null && body.comment !== ""
        ? { comment: body.comment }
        : {}),
    });
    const reviews = await reviewModel
      .find({ workerId: body.workerId })
      .select("rating")
      .lean();
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = sum / reviews.length;
    await userModel.findByIdAndUpdate(body.workerId, { rating: avg });
    return doc.toObject();
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 11000) {
      throw new AppError("Review already exists for this worker on this job", 409);
    }
    throw e;
  }
}
