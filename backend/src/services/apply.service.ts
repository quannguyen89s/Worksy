import applicationModel from "../models/application.model";
import jobModel from "../models/job.model";
import { AppError } from "../utils/AppError";
import { emitApplyNew } from "../sockets/emitters";

export async function createApply(
  workerId: string,
  body: { jobId: string; priceOffer?: number },
) {
  const job = await jobModel.findById(body.jobId);
  if (!job) throw new AppError("Job not found", 404);
  if (job.status === "full" || job.status === "done") {
    throw new AppError("Cannot apply to this job", 400);
  }
  try {
    const doc = await applicationModel.create({
      jobId: body.jobId,
      workerId,
      status: "pending",
      ...(body.priceOffer != null ? { priceOffer: body.priceOffer } : {}),
    });
    void emitApplyNew(String(job.createdBy), String(job._id), String(doc._id));
    return doc.toObject();
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 11000) {
      throw new AppError("Already applied", 409);
    }
    throw e;
  }
}

export async function cancelApply(applyId: string, workerId: string) {
  const app = await applicationModel.findById(applyId);
  if (!app) throw new AppError("Application not found", 404);
  if (String(app.workerId) !== workerId) {
    throw new AppError("Forbidden", 403);
  }
  if (app.status !== "pending") {
    throw new AppError("Only pending applications can be cancelled", 400);
  }
  await applicationModel.findByIdAndDelete(applyId);
  return { deleted: true };
}

export async function listMyApplies(workerId: string) {
  return applicationModel
    .find({ workerId })
    .populate("jobId")
    .sort({ createdAt: -1 })
    .lean();
}
