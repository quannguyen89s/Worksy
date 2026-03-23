import { Router } from "express";
import {
  completeJobController,
  createJobController,
  getJobController,
  listApplicantsController,
  listJobsController,
  listMyJobsController,
  listRecommendedController,
  selectWorkersController,
} from "../controllers/job.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth.middleware";

const jobRouter = Router();

jobRouter.get("/", listJobsController);
jobRouter.get("/recommended", requireAuth, requireRole("worker"), listRecommendedController);
jobRouter.get("/mine", requireAuth, requireRole("customer"), listMyJobsController);
jobRouter.get("/:id/applicants", requireAuth, requireRole("customer"), listApplicantsController);
jobRouter.post("/:id/select-workers", requireAuth, requireRole("customer"), selectWorkersController);
jobRouter.patch("/:id/complete", requireAuth, requireRole("customer"), completeJobController);
jobRouter.get("/:id", getJobController);
jobRouter.post("/", requireAuth, requireRole("customer"), createJobController);

export default jobRouter;
