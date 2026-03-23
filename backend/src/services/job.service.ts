import mongoose from "mongoose";
import jobModel from "../models/job.model";
import reviewModel from "../models/review.model";
import applicationModel from "../models/application.model";
import userModel from "../models/user.model";
import { haversineKm } from "../utils/distance";
import {
  calculateApplicantScore,
  recommendationScore,
} from "../utils/scoring";
import { AppError } from "../utils/AppError";
import { emitJobCompleted, emitJobNearby } from "../sockets/emitters";

type CompletionSource = "manual" | "auto";
const DEFAULT_AUTO_DONE_HOURS = Math.max(
  1,
  Number(process.env.JOB_AUTO_DONE_AFTER_HOURS ?? 72),
);

function computeCompletionDueAt(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
import {
  calculateTrustScore,
  shouldAutoApprove,
  formatTrustScoreLog,
} from "../utils/trustScore";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function jobPoint(job: { location?: { lat?: number; lng?: number } | null }) {
  return {
    lat: job.location?.lat ?? 0,
    lng: job.location?.lng ?? 0,
  };
}

function syncJobStatus(doc: {
  requiredWorkers: number;
  assignedWorkers: number;
  status: string;
}) {
  if (doc.status === "done") return;
  const { requiredWorkers, assignedWorkers } = doc;
  if (assignedWorkers >= requiredWorkers) {
    doc.status = "full";
  } else {
    doc.status = "open";
  }
}

export type WorkerBrowseFilters = {
  search?: string;
  status?: string[];
  minPrice?: number;
  maxPrice?: number;
  skillTags?: string[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: "price_asc" | "price_desc" | "date_desc" | "date_asc" | "distance";
  page?: number;
  limit?: number;
};

export async function listJobsForWorker(filters: WorkerBrowseFilters) {
  const {
    search,
    status = ["open", "partial", "full"],
    minPrice,
    maxPrice,
    skillTags,
    lat,
    lng,
    radiusKm = 10,
    sort = "date_desc",
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = {};

  // Chỉ hiển thị job đang tuyển (không pending, không done)
  query.status = { $in: status };

  if (search?.trim()) {
    const keyword = search.trim();
    const regex = new RegExp(escapeRegex(keyword), "i");
    query.$or = [
      { title: regex },
      { description: regex },
      { skillTags: regex },
    ];
  }

  if (minPrice != null && maxPrice != null && Number.isFinite(minPrice) && Number.isFinite(maxPrice)) {
    query.price = { $gte: minPrice, $lte: maxPrice };
  } else if (minPrice != null && Number.isFinite(minPrice)) {
    query.price = { $gte: minPrice };
  } else if (maxPrice != null && Number.isFinite(maxPrice)) {
    query.price = { $lte: maxPrice };
  }

  if (skillTags?.length) {
    const tags = skillTags.filter(Boolean).map((s) => s.trim());
    if (tags.length) {
      query.skillTags = { $in: tags };
    }
  }

  let jobs = await jobModel.find(query).sort({ createdAt: -1 }).lean();

  // Lọc theo khoảng cách nếu có lat, lng
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const userPoint = { lat: lat!, lng: lng! };
    jobs = jobs
      .map((j) => {
        const jl = jobPoint(j);
        const distanceKm = haversineKm(userPoint, jl);
        return { ...j, distanceKm };
      })
      .filter((j) => j.distanceKm <= radiusKm);
  }

  // Sort
  if (sort === "price_asc") {
    jobs.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (sort === "price_desc") {
    jobs.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  } else if (sort === "date_asc") {
    jobs.sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
    );
  } else if (sort === "date_desc") {
    jobs.sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    );
  } else if (sort === "distance" && Number.isFinite(lat) && Number.isFinite(lng)) {
    jobs.sort((a, b) => ((a as { distanceKm?: number }).distanceKm ?? 999) - ((b as { distanceKm?: number }).distanceKm ?? 999));
  }

  const total = jobs.length;
  const skip = Math.max(0, (page - 1) * limit);
  const paginated = jobs.slice(skip, skip + limit);

  return { data: paginated, total, page, limit };
}

export async function listJobsNearby(
  lat: number,
  lng: number,
  radiusKm = 10,
) {
  const jobs = await jobModel
    .find({ status: { $in: ["open", "full"] }, isDeleted: { $ne: true } })
    .lean();
  const withDist = jobs
    .map((j) => {
      const jl = jobPoint(j);
      const distanceKm = haversineKm({ lat, lng }, jl);
      return { ...j, distanceKm };
    })
    .filter((j) => j.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return withDist;
}

export async function getJobById(id: string) {
  const job = await jobModel.findById(id).lean();
  if (!job || job.isDeleted) throw new AppError("Job not found", 404);
  return job;
}

export async function createJob(
  customerId: string,
  body: {
    title: string;
    description: string;
    price: number;
    location: { lat: number; lng: number };
    scheduledAt: string | Date;
    requiredWorkers: number;
    skillTags?: string[];
  },
) {
  const schedule = new Date(body.scheduledAt);
  if (Number.isNaN(schedule.getTime())) {
    throw new AppError("scheduledAt is invalid", 400);
  }
  const job = await jobModel.create({
    title: body.title,
    description: body.description,
    price: body.price,
    location: body.location,
    scheduledAt: schedule,
    requiredWorkers: body.requiredWorkers,
    skillTags: body.skillTags ?? [],
    createdBy: customerId,
    assignedWorkers: 0,
    assignedWorkerIds: [],
    status: "pending",
    isDeleted: false,
  });
  const id = String(job._id);
  const dbName = mongoose.connection.db?.databaseName ?? "?";

  // AI Auto-approve: tính trust score từ user + job
  const user = await userModel.findById(customerId).lean();
  const completedAsCustomer = await jobModel.countDocuments({
    createdBy: customerId,
    status: "done",
    isDeleted: { $ne: true },
  });
  const { score, details } = calculateTrustScore(
    {
      isVerified: user?.isVerified ?? false,
      createdAt: user?.createdAt ?? null,
      completedJobsAsCustomer: completedAsCustomer,
    },
    {
      title: body.title,
      description: body.description,
      price: body.price,
      requiredWorkers: body.requiredWorkers,
    }
  );

  const logLines = formatTrustScoreLog(score, details);
  console.log(`[createJob] Job ${id}:`);
  logLines.forEach((line) => console.log(line));

  if (shouldAutoApprove(score)) {
    job.status = "open";
    await job.save();
    const loc = job.location ?? { lat: 0, lng: 0 };
    void emitJobNearby(id, loc, 10);
  }

  return job.toObject();
}

async function markJobDone(jobId: string, source: CompletionSource, customerId?: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const job = await jobModel.findById(jobId).session(session);
    if (!job) throw new AppError("Job not found", 404);
    if (customerId && String(job.createdBy) !== customerId) {
      throw new AppError("Forbidden", 403);
    }
    if (job.status === "done") {
      await session.commitTransaction();
      return job.toObject();
    }

    const workerIds = job.assignedWorkerIds.map(String);
    job.status = "done";
    job.completedAt = new Date();
    job.completionSource = source;
    job.completionDueAt = null;
    await job.save({ session });

    if (workerIds.length > 0) {
      await userModel.updateMany(
        { _id: { $in: workerIds } },
        { $inc: { completedJobs: 1 } },
        { session },
      );
    }

    await session.commitTransaction();
    void emitJobCompleted(String(job._id), String(job.createdBy), workerIds, source);
    return job.toObject();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function listMyJobs(customerId: string) {
  const jobs = await jobModel
    .find({ createdBy: customerId, isDeleted: { $ne: true } })
    .populate("assignedWorkerIds", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const doneIds = jobs
    .filter(
      (j) =>
        j.status === "done" &&
        Array.isArray(j.assignedWorkerIds) &&
        j.assignedWorkerIds.length > 0,
    )
    .map((j) => j._id);

  const countByJob = new Map<string, number>();
  if (doneIds.length > 0) {
    const counts = await reviewModel.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
      { $match: { jobId: { $in: doneIds } } },
      { $group: { _id: "$jobId", n: { $sum: 1 } } },
    ]);
    for (const row of counts) {
      countByJob.set(String(row._id), row.n);
    }
  }

  return jobs.map((j) => {
    const nw = Array.isArray(j.assignedWorkerIds) ? j.assignedWorkerIds.length : 0;
    let feedbackActionable = false;
    if (j.status === "done" && nw > 0) {
      const nr = countByJob.get(String(j._id)) ?? 0;
      feedbackActionable = nr < nw;
    }
    return { ...j, feedbackActionable };
  });
}

export async function listPendingJobs() {
  return jobModel
    .find({ status: "pending", isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean();
}

export async function listRecommendedJobs(
  workerId: string,
  lat?: number,
  lng?: number,
  limit = 20,
) {
  const worker = await userModel.findById(workerId).lean();
  if (!worker) throw new AppError("Worker not found", 404);
  const wLat = lat ?? worker.location?.lat ?? 0;
  const wLng = lng ?? worker.location?.lng ?? 0;
  const skills = worker.skills ?? [];
  const jobs = await jobModel
    .find({ status: "open", isDeleted: { $ne: true } })
    .lean();
  const scored = jobs.map((j) => {
    const jl = jobPoint(j);
    const distanceKm = haversineKm({ lat: wLat, lng: wLng }, jl);
    const recommendationScoreVal = recommendationScore({
      jobTags: j.skillTags ?? [],
      workerSkills: skills,
      jobPrice: j.price,
      distanceKm,
    });
    return { ...j, distanceKm, recommendationScore: recommendationScoreVal };
  });
  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return scored.slice(0, limit);
}

export async function listApplicantsRanked(jobId: string, customerId: string) {
  const job = await jobModel.findById(jobId).lean();
  if (!job || job.isDeleted) throw new AppError("Job not found", 404);
  if (String(job.createdBy) !== customerId) {
    throw new AppError("Forbidden", 403);
  }
  const applies = await applicationModel
    .find({ jobId, status: "pending" })
    .populate("workerId")
    .lean();
  type PopWorker = {
    _id: unknown;
    rating?: number;
    completedJobs?: number;
    location?: { lat: number; lng: number };
  };
  const rows = applies.map((a) => {
    const w = a.workerId as unknown as PopWorker;
    const workerLocation = {
      lat: w?.location?.lat ?? 0,
      lng: w?.location?.lng ?? 0,
    };
    const score = calculateApplicantScore({
      workerRating: w?.rating ?? 3.5,
      workerCompletedJobs: w?.completedJobs ?? 0,
      workerLocation,
      jobPrice: job.price,
      jobLocation: jobPoint(job),
      ...(a.priceOffer != null ? { priceOffer: a.priceOffer } : {}),
    });
    return {
      apply: a,
      worker: w,
      score,
    };
  });
  rows.sort((x, y) => y.score - x.score);
  return rows;
}

export async function selectWorkers(
  jobId: string,
  customerId: string,
  workerIds: string[],
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const job = await jobModel.findById(jobId).session(session);
    if (!job || job.isDeleted) throw new AppError("Job not found", 404);
    if (String(job.createdBy) !== customerId) {
      throw new AppError("Forbidden", 403);
    }
    if (job.status === "done") {
      throw new AppError("Job already completed", 400);
    }
    const remaining = job.requiredWorkers - job.assignedWorkers;
    if (remaining <= 0) {
      throw new AppError("No slots available", 400);
    }
    const idSet = new Set(workerIds.map(String));
    const pending = await applicationModel
      .find({
        jobId,
        status: "pending",
        workerId: { $in: [...idSet] },
      })
      .session(session)
      .lean();
    const workerObjectIds = pending.map((a) => a.workerId);
    const workers = await userModel
      .find({ _id: { $in: workerObjectIds } })
      .session(session)
      .lean();
    const wMap = new Map(workers.map((w) => [String(w._id), w]));
    const scored = pending.map((a) => {
      const w = wMap.get(String(a.workerId));
      const workerLocation = {
        lat: w?.location?.lat ?? 0,
        lng: w?.location?.lng ?? 0,
      };
      const score = calculateApplicantScore({
        workerRating: w?.rating ?? 3.5,
        workerCompletedJobs: w?.completedJobs ?? 0,
        workerLocation,
        jobPrice: job.price,
        jobLocation: jobPoint(job),
        ...(a.priceOffer != null ? { priceOffer: a.priceOffer } : {}),
      });
      return { applyId: String(a._id), workerId: String(a.workerId), score };
    });
    scored.sort((x, y) => y.score - x.score);
    const pick = scored.slice(0, remaining);
    const pickedWorkerIds = new Set(pick.map((p) => p.workerId));
    for (const p of pick) {
      await applicationModel.findByIdAndUpdate(
        p.applyId,
        { status: "accepted" },
        { session },
      );
    }
    for (const row of scored) {
      if (!pickedWorkerIds.has(row.workerId)) {
        await applicationModel.findByIdAndUpdate(
          row.applyId,
          { status: "rejected" },
          { session },
        );
      }
    }
    const added = pick.map(
      (p) => new mongoose.Types.ObjectId(p.workerId),
    );
    job.assignedWorkerIds = [...job.assignedWorkerIds, ...added];
    job.assignedWorkers = job.assignedWorkerIds.length;
    syncJobStatus(job);
    if (job.assignedWorkers > 0 && !job.completionDueAt) {
      const autoDoneAfterHours = Math.max(
        1,
        job.autoDoneAfterHours ?? DEFAULT_AUTO_DONE_HOURS,
      );
      job.completionDueAt = computeCompletionDueAt(autoDoneAfterHours);
    }
    await job.save({ session });
    await session.commitTransaction();
    return job.toObject();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function approveJob(jobId: string) {
  const job = await jobModel.findById(jobId);
  if (!job || job.isDeleted) throw new AppError("Job not found", 404);
  if (job.status !== "pending") {
    throw new AppError("Chỉ tin pending mới được duyệt", 400);
  }
  job.status = "open";
  await job.save();
  const id = String(job._id);
  const loc = job.location ?? { lat: 0, lng: 0 };
  void emitJobNearby(id, loc, 10);
  return job.toObject();
}

export async function updateJob(
  jobId: string,
  customerId: string,
  body: {
    title?: string;
    description?: string;
    price?: number;
    location?: { lat: number; lng: number };
    scheduledAt?: string | Date;
    requiredWorkers?: number;
    skillTags?: string[];
  },
) {
  const job = await jobModel.findById(jobId);
  if (!job || job.isDeleted) throw new AppError("Job not found", 404);
  if (String(job.createdBy) !== customerId) {
    throw new AppError("Forbidden", 403);
  }
  if (job.status === "pending") {
    throw new AppError("Tin chưa được admin duyệt, không thể chỉnh sửa", 400);
  }
  if (job.status !== "open" || job.assignedWorkers > 0) {
    throw new AppError(
      "Job can only be updated when status is open and no workers assigned",
      400,
    );
  }
  if (body.price !== undefined && body.price < 0) {
    throw new AppError("Price must be >= 0", 400);
  }
  if (body.requiredWorkers !== undefined && body.requiredWorkers < 1) {
    throw new AppError("requiredWorkers must be >= 1", 400);
  }
  if (body.scheduledAt !== undefined) {
    const schedule = new Date(body.scheduledAt);
    if (Number.isNaN(schedule.getTime())) {
      throw new AppError("scheduledAt is invalid", 400);
    }
    job.scheduledAt = schedule;
  }
  if (body.title !== undefined) job.title = body.title;
  if (body.description !== undefined) job.description = body.description;
  if (body.price !== undefined) job.price = body.price;
  if (body.location !== undefined) job.location = body.location;
  if (body.requiredWorkers !== undefined) job.requiredWorkers = body.requiredWorkers;
  if (body.skillTags !== undefined) job.skillTags = body.skillTags;
  await job.save();
  return job.toObject();
}

export async function deleteJob(jobId: string, customerId: string) {
  const job = await jobModel.findById(jobId);
  if (!job || job.isDeleted) throw new AppError("Job not found", 404);
  if (String(job.createdBy) !== customerId) {
    throw new AppError("Forbidden", 403);
  }
  if (job.status === "pending") {
    throw new AppError("Tin chưa được admin duyệt. Chỉ xóa được sau khi admin duyệt", 400);
  }
  if (job.status !== "open" || job.assignedWorkers > 0) {
    throw new AppError(
      "Job can only be deleted when status is open and no workers assigned",
      400,
    );
  }
  job.isDeleted = true;
  await job.save();
  return { deleted: true, id: jobId };
}

export async function completeJob(jobId: string, customerId: string) {
  const job = await jobModel.findById(jobId);
  if (!job || job.isDeleted) throw new AppError("Job not found", 404);
  if (String(job.createdBy) !== customerId) {
    throw new AppError("Forbidden", 403);
  }
  if (job.status === "done") {
    return job.toObject();
  }
  job.status = "done";
  await job.save();
  const workerIds = job.assignedWorkerIds.map(String);
  if (workerIds.length > 0) {
    await userModel.updateMany(
      { _id: { $in: workerIds } },
      { $inc: { completedJobs: 1 } },
    );
  return markJobDone(jobId, "manual", customerId);
}
}

export async function completeOverdueJobs() {
  const now = new Date();
  const dueJobs = await jobModel
    .find({
      status: { $in: ["open", "partial", "full"] },
      completionDueAt: { $ne: null, $lte: now },
      assignedWorkers: { $gt: 0 },
    })
    .select("_id")
    .lean();

  let completed = 0;
  for (const row of dueJobs) {
    try {
      await markJobDone(String(row._id), "auto");
      completed += 1;
    } catch (err) {
      console.error("[job:auto-done] failed to complete job:", row._id, err);
    }
  }
  return { scanned: dueJobs.length, completed };
}
