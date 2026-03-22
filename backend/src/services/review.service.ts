import jobModel from "../models/job.model";
import reviewModel from "../models/review.model";
import userModel from "../models/user.model";
import { AppError } from "../utils/AppError";

export async function createReview(
  customerId: string,
  body: {
    jobId: string;
    workerId: string;
    rating: number;
    comment?: string;
  },
) {
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
