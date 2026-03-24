import { Router } from "express";
import {
  approveJobController,
  completeJobController,
  createJobController,
  createJobReviewForOwnerController,
  listPendingJobsController,
  deleteJobController,
  getJobController,
  listApplicantsController,
  listJobReviewsForOwnerController,
  listJobsBrowseController,
  listJobsController,
  listMyJobsController,
  listRecommendedController,
  selectWorkersController,
  updateJobController,
} from "../controllers/job.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth.middleware";

const jobRouter = Router();

jobRouter.get("/", listJobsController);
jobRouter.get("/browse", requireAuth, requireRole("worker"), listJobsBrowseController);
jobRouter.get("/pending", requireAuth, requireRole("admin"), listPendingJobsController);
jobRouter.get("/recommended", requireAuth, requireRole("worker"), listRecommendedController);
jobRouter.get("/mine", requireAuth, requireRole("customer"), listMyJobsController);
jobRouter.get(
  "/:id/reviews",
  requireAuth,
  listJobReviewsForOwnerController,
);
jobRouter.post(
  "/:id/reviews",
  requireAuth,
  createJobReviewForOwnerController,
);
jobRouter.get("/:id/applicants", requireAuth, requireRole("customer"), listApplicantsController);
jobRouter.post("/:id/select-workers", requireAuth, requireRole("customer"), selectWorkersController);
jobRouter.patch("/:id/complete", requireAuth, requireRole("customer"), completeJobController);
jobRouter.patch("/:id/approve", requireAuth, requireRole("admin"), approveJobController);
jobRouter.get("/:id", getJobController);
jobRouter.post("/", requireAuth, requireRole("customer"), createJobController);
jobRouter.patch("/:id", requireAuth, requireRole("customer"), updateJobController);
jobRouter.delete("/:id", requireAuth, requireRole("customer"), deleteJobController);

export default jobRouter;
