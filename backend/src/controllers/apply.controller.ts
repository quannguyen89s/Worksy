import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paramId } from "../utils/routeParams";
import * as applyService from "../services/apply.service";

export const createApplyController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId, priceOffer } = req.body as {
    jobId: string;
    priceOffer?: number;
  };
  const body: { jobId: string; priceOffer?: number } = { jobId };
  if (priceOffer !== undefined) body.priceOffer = priceOffer;
  const data = await applyService.createApply(req.user!.id, body);
  res.status(201).json({ success: true, data });
});

export const cancelApplyController = asyncHandler(async (req: Request, res: Response) => {
  const data = await applyService.cancelApply(paramId(req), req.user!.id);
  res.json({ success: true, data });
});

export const listMyAppliesController = asyncHandler(async (req: Request, res: Response) => {
  const data = await applyService.listMyApplies(req.user!.id);
  res.json({ success: true, data });
});
