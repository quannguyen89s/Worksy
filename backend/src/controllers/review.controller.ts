import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as reviewService from "../services/review.service";

export const createReviewController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId, workerId, rating, comment } = req.body as {
    jobId: string;
    workerId: string;
    rating: number;
    comment?: string;
  };
  const body: {
    jobId: string;
    workerId: string;
    rating: number;
    comment?: string;
  } = { jobId, workerId, rating };
  if (comment !== undefined) body.comment = comment;
  const data = await reviewService.createReview(req.user!.id, body);
  res.status(201).json({ success: true, data });
});
