import applicationModel from "../models/application.model";
import jobModel from "../models/job.model";
import { AppError } from "../utils/AppError";
import { emitApplyNew } from "../sockets/emitters";

function sameSlot(a?: Date | string | null, b?: Date | string | null) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
}

export async function createApply(
  workerId: string,
  body: { jobId: string; priceOffer?: number },
) {
  const job = await jobModel.findById(body.jobId);
  if (!job) throw new AppError("Job not found", 404);
  if (job.isDeleted) throw new AppError("Job not found", 404);
  // Chỉ nhận ứng tuyển khi job đã được admin duyệt và đang mở.
  if (job.status !== "open") {
    throw new AppError("Cannot apply to this job", 400);
  }

  const activeApplies = await applicationModel
    .find({
      workerId,
      status: { $in: ["pending", "accepted"] },
    })
    .populate("jobId", "scheduledAt")
    .lean();
  for (const row of activeApplies) {
    const j = row.jobId as unknown as { _id?: unknown; scheduledAt?: Date | string };
    if (!j?._id) continue;
    if (String(j._id) === String(job._id)) continue;
    if (sameSlot(j.scheduledAt, job.scheduledAt)) {
      throw new AppError("You already have another job application at this time", 409);
    }
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
