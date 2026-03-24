import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paramId } from "../utils/routeParams";
import * as jobService from "../services/job.service";
import * as reviewService from "../services/review.service";

export const listJobsBrowseController = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const statusRaw = req.query.status;
  const status = Array.isArray(statusRaw)
    ? (statusRaw as string[])
    : typeof statusRaw === "string"
      ? statusRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
  const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : undefined;
  const skillTagsRaw = req.query.skillTags;
  const skillTags = Array.isArray(skillTagsRaw)
    ? (skillTagsRaw as string[])
    : typeof skillTagsRaw === "string"
      ? skillTagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
  const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
  const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
  const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : 10;
  const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
  const page = req.query.page != null ? Number(req.query.page) : 1;
  const limit = req.query.limit != null ? Number(req.query.limit) : 20;

  const validSorts = ["price_asc", "price_desc", "date_desc", "date_asc", "distance"] as const;
  const validSort = sort && validSorts.includes(sort as typeof validSorts[number])
    ? (sort as typeof validSorts[number])
    : ("date_desc" as const);

  const filters: Parameters<typeof jobService.listJobsForWorker>[0] = {
    radiusKm: Number.isFinite(radiusKm) ? radiusKm : 10,
    sort: validSort,
    page: Math.max(1, Math.floor(page)),
    limit: Math.min(500, Math.max(1, Math.floor(limit))),
  };
  if (search) filters.search = search;
  if (status?.length) filters.status = status;
  if (Number.isFinite(minPrice)) filters.minPrice = minPrice!;
  if (Number.isFinite(maxPrice)) filters.maxPrice = maxPrice!;
  if (skillTags?.length) filters.skillTags = skillTags;
  if (Number.isFinite(lat)) filters.lat = lat!;
  if (Number.isFinite(lng)) filters.lng = lng!;

  const data = await jobService.listJobsForWorker(filters);
  res.json({ success: true, ...data });
});

export const listJobsController = asyncHandler(async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : 10;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      success: false,
      message: "Query lat and lng are required",
    });
  }
  const data = await jobService.listJobsNearby(lat, lng, radiusKm);
  res.json({ success: true, data });
});

export const getJobController = asyncHandler(async (req: Request, res: Response) => {
  const data = await jobService.getJobById(paramId(req));
  res.json({ success: true, data });
});

export const createJobController = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const {
    title,
    description,
    price,
    location,
    address,
    scheduledAt,
    requiredWorkers,
    skillTags,
  } = req.body as {
    title: string;
    description: string;
    price: number;
    location: { lat: number; lng: number };
    address?: string;
    scheduledAt: string | Date;
    requiredWorkers: number;
    skillTags?: string[];
  };
  const payload: {
    title: string;
    description: string;
    price: number;
    location: { lat: number; lng: number };
    address?: string;
    scheduledAt: string | Date;
    requiredWorkers: number;
    skillTags?: string[];
  } = {
    title,
    description,
    price,
    location,
    scheduledAt,
    requiredWorkers,
  };
  if (address !== undefined) payload.address = address;
  if (skillTags !== undefined) payload.skillTags = skillTags;
  const data = await jobService.createJob(customerId, payload);
  res.status(201).json({ success: true, data });
});

export const updateJobController = asyncHandler(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const {
    title,
    description,
    price,
    location,
    address,
    scheduledAt,
    requiredWorkers,
    skillTags,
  } = req.body as {
    title?: string;
    description?: string;
    price?: number;
    location?: { lat: number; lng: number };
    address?: string;
    scheduledAt?: string | Date;
    requiredWorkers?: number;
    skillTags?: string[];
  };
  const payload: {
    title?: string;
    description?: string;
    price?: number;
    location?: { lat: number; lng: number };
    address?: string;
    scheduledAt?: string | Date;
    requiredWorkers?: number;
    skillTags?: string[];
  } = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (price !== undefined) payload.price = price;
  if (location !== undefined) payload.location = location;
  if (address !== undefined) payload.address = address;
  if (scheduledAt !== undefined) payload.scheduledAt = scheduledAt;
  if (requiredWorkers !== undefined) payload.requiredWorkers = requiredWorkers;
  if (skillTags !== undefined) payload.skillTags = skillTags;
  const data = await jobService.updateJob(paramId(req), customerId, payload);
  res.json({ success: true, data });
});

export const deleteJobController = asyncHandler(async (req: Request, res: Response) => {
  const data = await jobService.deleteJob(paramId(req), req.user!.id);
  res.json({ success: true, data });
});

export const listMyJobsController = asyncHandler(async (req: Request, res: Response) => {
  const data = await jobService.listMyJobs(req.user!.id);
  res.json({ success: true, data });
});

export const listRecommendedController = asyncHandler(
  async (req: Request, res: Response) => {
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
    const limit = req.query.limit != null ? Number(req.query.limit) : 20;
    const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : 20;
    const data = await jobService.listRecommendedJobs(
      req.user!.id,
      lat,
      lng,
      Number.isFinite(limit) ? limit : 20,
      Number.isFinite(radiusKm) ? radiusKm : 20,
    );
    res.json({ success: true, data });
  },
);

export const listApplicantsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await jobService.listApplicantsRanked(
      paramId(req),
      req.user!.id,
    );
    res.json({ success: true, data });
  },
);

export const selectWorkersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { workerIds } = req.body as { workerIds: string[] };
    const data = await jobService.selectWorkers(
      paramId(req),
      req.user!.id,
      workerIds ?? [],
    );
    res.json({ success: true, data });
  },
);

export const completeJobController = asyncHandler(async (req: Request, res: Response) => {
  const data = await jobService.completeJob(paramId(req), req.user!.id);
  res.json({ success: true, data });
});

export const listPendingJobsController = asyncHandler(async (req: Request, res: Response) => {
  const data = await jobService.listPendingJobs();
  res.json({ success: true, data });
});

export const approveJobController = asyncHandler(async (req: Request, res: Response) => {
  const data = await jobService.approveJob(paramId(req));
  res.json({ success: true, data });
});

/** Đánh giá thợ (chủ job): cùng nhóm URL với /jobs để tránh 404 proxy / path sai. */
export const listJobReviewsForOwnerController = asyncHandler(
  async (req: Request, res: Response) => {
    const jobId = paramId(req);
    const data = await reviewService.listReviewsForCustomerJob(
      req.user!.id,
      jobId,
    );
    res.json({ success: true, data });
  },
);

export const createJobReviewForOwnerController = asyncHandler(
  async (req: Request, res: Response) => {
    const jobId = paramId(req);
    const { workerId, rating, comment } = req.body as {
      workerId: string;
      rating: number;
      comment?: string;
    };
    const payload: {
      jobId: string;
      workerId: string;
      rating: number;
      comment?: string;
    } = { jobId, workerId, rating };
    if (comment !== undefined) payload.comment = comment;
    const data = await reviewService.createReview(req.user!.id, payload);
    res.status(201).json({ success: true, data });
  },
);
