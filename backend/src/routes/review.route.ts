import { Router } from "express";
import { createReviewController } from "../controllers/review.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth.middleware";

const reviewRouter = Router();

reviewRouter.post("/", requireAuth, requireRole("customer"), createReviewController);

export default reviewRouter;
