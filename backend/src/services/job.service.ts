import mongoose from "mongoose";
import jobModel from "../models/job.model";
import applicationModel from "../models/application.model";
import userModel from "../models/user.model";
import { haversineKm } from "../utils/distance";
import {
  calculateApplicantScore,
  recommendationScore,
} from "../utils/scoring";
import { AppError } from "../utils/AppError";
import { emitJobNearby } from "../sockets/emitters";

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
  } else if (assignedWorkers > 0) {
    doc.status = "partial";
  } else {
    doc.status = "open";
  }
}

export async function listJobsNearby(
  lat: number,
  lng: number,
  radiusKm = 10,
) {
  const jobs = await jobModel
    .find({ status: { $in: ["open", "partial", "full"] } })
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
  if (!job) throw new AppError("Job not found", 404);
  return job;
}

export async function createJob(
  customerId: string,
  body: {
    title: string;
    description: string;
    price: number;
    location: { lat: number; lng: number };
    requiredWorkers: number;
    skillTags?: string[];
  },
) {
  const job = await jobModel.create({
    title: body.title,
    description: body.description,
    price: body.price,
    location: body.location,
    requiredWorkers: body.requiredWorkers,
    skillTags: body.skillTags ?? [],
    createdBy: customerId,
    assignedWorkers: 0,
    assignedWorkerIds: [],
    status: "open",
  });
  const id = String(job._id);
  void emitJobNearby(id, body.location, 10);
  return job.toObject();
}

export async function listMyJobs(customerId: string) {
  return jobModel.find({ createdBy: customerId }).sort({ createdAt: -1 }).lean();
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
    .find({ status: { $in: ["open", "partial"] } })
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
  if (!job) throw new AppError("Job not found", 404);
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
    if (!job) throw new AppError("Job not found", 404);
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

export async function completeJob(jobId: string, customerId: string) {
  const job = await jobModel.findById(jobId);
  if (!job) throw new AppError("Job not found", 404);
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
  }
  return job.toObject();
}
