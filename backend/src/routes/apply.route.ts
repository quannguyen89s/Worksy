import { Router } from "express";
import {
  cancelApplyController,
  createApplyController,
  listMyAppliesController,
} from "../controllers/apply.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth.middleware";

const applyRouter = Router();

applyRouter.post("/", requireAuth, requireRole("worker"), createApplyController);
applyRouter.get("/me", requireAuth, requireRole("worker"), listMyAppliesController);
applyRouter.delete("/:id", requireAuth, requireRole("worker"), cancelApplyController);

export default applyRouter;
