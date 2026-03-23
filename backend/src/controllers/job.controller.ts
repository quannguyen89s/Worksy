import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paramId } from "../utils/routeParams";
import * as jobService from "../services/job.service";

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
    requiredWorkers,
    skillTags,
  } = req.body as {
    title: string;
    description: string;
    price: number;
    location: { lat: number; lng: number };
    requiredWorkers: number;
    skillTags?: string[];
  };
  const payload: {
    title: string;
    description: string;
    price: number;
    location: { lat: number; lng: number };
    requiredWorkers: number;
    skillTags?: string[];
  } = {
    title,
    description,
    price,
    location,
    requiredWorkers,
  };
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
    requiredWorkers,
    skillTags,
  } = req.body as {
    title?: string;
    description?: string;
    price?: number;
    location?: { lat: number; lng: number };
    requiredWorkers?: number;
    skillTags?: string[];
  };
  const payload: {
    title?: string;
    description?: string;
    price?: number;
    location?: { lat: number; lng: number };
    requiredWorkers?: number;
    skillTags?: string[];
  } = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (price !== undefined) payload.price = price;
  if (location !== undefined) payload.location = location;
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
    const data = await jobService.listRecommendedJobs(
      req.user!.id,
      lat,
      lng,
      Number.isFinite(limit) ? limit : 20,
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
