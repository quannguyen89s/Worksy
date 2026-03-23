import { Router } from "express";
import {
  createReviewController,
  listReviewsForJobController,
} from "../controllers/review.controller";
import { requireAuth } from "../middlewares/requireAuth.middleware";

const reviewRouter = Router();

/** Chỉ requireAuth: quyền chủ job được kiểm tra trong review.service (createdBy === user). */
reviewRouter.get("/job/:jobId", requireAuth, listReviewsForJobController);
reviewRouter.post("/", requireAuth, createReviewController);

export default reviewRouter;
