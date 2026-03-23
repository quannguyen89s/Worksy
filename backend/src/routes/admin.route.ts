import { Router } from "express";
import {
  adminDeleteJobController,
  adminListJobsController,
  adminListUsersController,
  adminMetaCategoriesController,
  adminOverviewController,
  adminUpdateJobController,
  adminUpdateUserController,
  adminCreateUserController,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth.middleware";

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/overview", adminOverviewController);
adminRouter.get("/meta/categories", adminMetaCategoriesController);
adminRouter.get("/users", adminListUsersController);
adminRouter.post("/users", adminCreateUserController);
adminRouter.patch("/users/:id", adminUpdateUserController);
adminRouter.get("/jobs", adminListJobsController);
adminRouter.patch("/jobs/:id", adminUpdateJobController);
adminRouter.delete("/jobs/:id", adminDeleteJobController);

export default adminRouter;
