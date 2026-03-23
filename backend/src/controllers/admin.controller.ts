import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paramId } from "../utils/routeParams";
import * as adminService from "../services/admin.service";

function parsePageLimit(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  return { page, limit };
}

export const adminOverviewController = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await adminService.getOverview();
    res.json({ success: true, data });
  },
);

export const adminMetaCategoriesController = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: { categories: adminService.SERVICE_CATEGORY_SUGGESTIONS },
    });
  },
);

export const adminListUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = parsePageLimit(req);
    const role =
      typeof req.query.role === "string" ? req.query.role : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const data = await adminService.listUsers({
      page,
      limit,
      ...(role ? { role } : {}),
      ...(search !== undefined && search !== "" ? { search } : {}),
    });
    res.json({ success: true, data });
  },
);

export const adminUpdateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = paramId(req);
    const body = req.body as { role?: string; isVerified?: boolean };
    const data = await adminService.updateUser(id, body, req.user!.id);
    res.json({ success: true, data });
  },
);

export const adminCreateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as {
      name: string;
      email: string;
      password: string;
      confirm_password: string;
      role?: string;
      isVerified?: boolean;
    };
    const data = await adminService.createUserByAdmin(body);
    res.json({ success: true, data });
  },
);

export const adminListJobsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = parsePageLimit(req);
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const data = await adminService.listJobs({
      page,
      limit,
      ...(status ? { status } : {}),
      ...(search !== undefined && search !== "" ? { search } : {}),
    });
    res.json({ success: true, data });
  },
);

export const adminUpdateJobController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = paramId(req);
    const body = req.body as {
      status?: string;
      title?: string;
      description?: string;
      price?: number;
    };
    const data = await adminService.updateJob(id, body);
    res.json({ success: true, data });
  },
);

export const adminDeleteJobController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = paramId(req);
    const data = await adminService.deleteJob(id);
    res.json({ success: true, data });
  },
);
