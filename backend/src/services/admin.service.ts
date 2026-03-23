import applicationModel from "../models/application.model";
import jobModel from "../models/job.model";
import reviewModel from "../models/review.model";
import userModel from "../models/user.model";
import bcrypt from "bcryptjs";
import { AppError } from "../utils/AppError";

function relativeTimeVi(d: Date | string | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  const t = dt.getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 45) return "Vừa xong";
  if (sec < 3600) return `${Math.floor(sec / 60)} phút trước`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} giờ trước`;
  if (sec < 172800) return "Hôm qua";
  const days = Math.floor(sec / 86400);
  return `${days} ngày trước`;
}

function moneyVi(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Gợi ý danh mục dịch vụ (chỉ đọc — admin tham khảo, không ảnh hưởng app mobile). */
export const SERVICE_CATEGORY_SUGGESTIONS = [
  "Dọn dẹp",
  "Sửa chữa",
  "Giao hàng",
  "IT / Thiết bị",
  "Sự kiện",
  "Khác",
];

export async function getOverview() {
  const now = new Date();
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  const t7 = new Date(now.getTime() - ms7);
  const t14 = new Date(now.getTime() - 2 * ms7);

  const [
    userCounts,
    jobCounts,
    revenueAgg,
    revCurrentAgg,
    revPrevAgg,
    jobsCreatedCurrent,
    jobsCreatedPrev,
    pendingUsers,
    pendingOpenJobs,
    activityDoneJobs,
    activityNewUsers,
    unverifiedWorkerCount,
    lastUsersForAvatars,
    lowRatingReviews,
  ] = await Promise.all([
    userModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    jobModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    jobModel.aggregate([
      { $match: { status: "done" } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]),
    jobModel.aggregate([
      { $match: { status: "done", updatedAt: { $gte: t7 } } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]),
    jobModel.aggregate([
      {
        $match: {
          status: "done",
          updatedAt: { $gte: t14, $lt: t7 },
        },
      },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]),
    jobModel.countDocuments({ createdAt: { $gte: t7 } }),
    jobModel.countDocuments({ createdAt: { $gte: t14, $lt: t7 } }),
    userModel
      .find({
        isVerified: false,
        role: { $in: ["customer", "worker"] },
      })
      .sort({ createdAt: -1 })
      .limit(4)
      .select("name role createdAt")
      .lean(),
    jobModel
      .find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title createdAt")
      .lean(),
    jobModel
      .find({ status: "done" })
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("title price updatedAt _id")
      .lean(),
    userModel
      .find({ role: { $in: ["customer", "worker"] } })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("name email createdAt _id")
      .lean(),
    userModel.countDocuments({ isVerified: false, role: "worker" }),
    userModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .select("name")
      .lean(),
    reviewModel.countDocuments({ rating: { $lte: 2 } }),
  ]);

  const byRole: Record<string, number> = {};
  for (const row of userCounts) {
    if (row._id) byRole[String(row._id)] = row.count;
  }
  const byStatus: Record<string, number> = {};
  for (const row of jobCounts) {
    if (row._id) byStatus[String(row._id)] = row.count;
  }
  const totalUsers = userCounts.reduce((s, x) => s + x.count, 0);
  const totalJobs = jobCounts.reduce((s, x) => s + x.count, 0);
  const revenueDone = revenueAgg[0]?.total ?? 0;
  const revenueCurrentPeriod = revCurrentAgg[0]?.total ?? 0;
  const revenuePreviousPeriod = revPrevAgg[0]?.total ?? 0;

  let revenueTrendPercent: number | null = null;
  if (revenuePreviousPeriod > 0) {
    revenueTrendPercent =
      Math.round(
        ((revenueCurrentPeriod - revenuePreviousPeriod) /
          revenuePreviousPeriod) *
          1000,
      ) / 10;
  }

  let jobMomentumLabel: string;
  if (totalJobs === 0) {
    jobMomentumLabel = "Chưa có việc";
  } else if (
    jobsCreatedCurrent > jobsCreatedPrev * 1.15 &&
    jobsCreatedCurrent >= 1
  ) {
    jobMomentumLabel = "ĐANG TĂNG MẠNH";
  } else if (jobsCreatedPrev > 0 && jobsCreatedCurrent < jobsCreatedPrev * 0.85) {
    jobMomentumLabel = "Ít việc mới hơn tuần trước";
  } else {
    jobMomentumLabel = "Ổn định";
  }

  const pendingApprovals: {
    id: string;
    kind: "user_verify" | "job_open";
    title: string;
    subtitle: string;
  }[] = [
    ...pendingUsers.map((u) => ({
      id: `u_${String(u._id)}`,
      kind: "user_verify" as const,
      title: u.name,
      subtitle: `Xác minh ${u.role === "worker" ? "Thợ" : "Khách"} • ${relativeTimeVi(u.createdAt)}`,
    })),
    ...pendingOpenJobs.map((j) => ({
      id: `j_${String(j._id)}`,
      kind: "job_open" as const,
      title: j.title,
      subtitle: `Việc đang mở • ${relativeTimeVi(j.createdAt)}`,
    })),
  ].slice(0, 5);

  type ActivityKind = "job_done" | "user_new" | "system";
  const activityRows: {
    id: string;
    kind: ActivityKind;
    title: string;
    subtitle: string;
    at: string;
  }[] = [];

  for (const j of activityDoneJobs) {
    const at = j.updatedAt ? new Date(j.updatedAt) : new Date();
    activityRows.push({
      id: `jd_${String(j._id)}`,
      kind: "job_done",
      title: "Việc đã hoàn thành",
      subtitle: `${j.title} — ${moneyVi(j.price)}`,
      at: at.toISOString(),
    });
  }
  for (const u of activityNewUsers) {
    const at = u.createdAt ? new Date(u.createdAt) : new Date();
    activityRows.push({
      id: `nu_${String(u._id)}`,
      kind: "user_new",
      title: "Người dùng mới",
      subtitle: `${u.name} • ${u.email}`,
      at: at.toISOString(),
    });
  }
  if (unverifiedWorkerCount >= 3) {
    activityRows.push({
      id: "sys_unverified",
      kind: "system",
      title: "Cần duyệt tài khoản",
      subtitle: `${unverifiedWorkerCount} thợ chưa xác minh`,
      at: now.toISOString(),
    });
  }
  const jobsOpen = byStatus.open ?? 0;
  if (jobsOpen > 10) {
    activityRows.push({
      id: "sys_open_jobs",
      kind: "system",
      title: "Nhiều việc đang mở",
      subtitle: `${jobsOpen} việc chờ gán thợ`,
      at: now.toISOString(),
    });
  }
  if (lowRatingReviews > 0) {
    activityRows.push({
      id: "sys_reviews",
      kind: "system",
      title: "Đánh giá cần chú ý",
      subtitle: `${lowRatingReviews} đánh giá ≤ 2★`,
      at: now.toISOString(),
    });
  }

  activityRows.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  const recentActivity = activityRows.slice(0, 8);

  const recentUserInitials = lastUsersForAvatars
    .map((u) => {
      const p = String(u.name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const first = p[0];
      const last = p.length >= 2 ? p[p.length - 1] : undefined;
      if (first && last) {
        const a = first[0];
        const b = last[0];
        if (a && b) return `${a}${b}`.toUpperCase();
      }
      const one = first ?? "U";
      return one.slice(0, 2).toUpperCase();
    })
    .filter(Boolean);

  const jobsDone = byStatus.done ?? 0;
  const completionRate =
    totalJobs > 0 ? Math.min(100, Math.round((jobsDone / totalJobs) * 100)) : 0;

  return {
    totalUsers,
    customers: byRole.customer ?? 0,
    workers: byRole.worker ?? 0,
    admins: byRole.admin ?? 0,
    jobsOpen,
    jobsPartial: byStatus.partial ?? 0,
    jobsFull: byStatus.full ?? 0,
    jobsDone,
    totalJobs,
    revenueDone,
    reportedPosts: lowRatingReviews,
    revenueCurrentPeriod,
    revenuePreviousPeriod,
    revenueTrendPercent,
    revenueTrendPeriodLabel: "So với 7 ngày trước",
    jobMomentumLabel,
    completionRate,
    pendingApprovals,
    recentActivity,
    recentUserInitials,
  };
}

export async function listUsers(params: {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}) {
  const { page, limit, role, search } = params;
  const q: Record<string, unknown> = {};
  if (role && ["customer", "worker", "admin"].includes(role)) {
    q.role = role;
  }
  if (search?.trim()) {
    const s = search.trim();
    q.$or = [
      { name: new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { email: new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    userModel
      .find(q)
      .select("-password -refreshToken -forgotPasswordToken -emailVerifyToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    userModel.countDocuments(q),
  ]);
  return { items, total, page, limit };
}

export async function updateUser(
  targetId: string,
  body: { role?: string; isVerified?: boolean },
  adminId: string,
) {
  if (targetId === adminId && body.role && body.role !== "admin") {
    throw new AppError("Cannot remove own admin role", 400);
  }
  const updates: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!["customer", "worker", "admin"].includes(body.role)) {
      throw new AppError("Invalid role", 400);
    }
    updates.role = body.role;
  }
  if (body.isVerified !== undefined) {
    updates.isVerified = Boolean(body.isVerified);
  }
  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields", 400);
  }
  const user = await userModel
    .findByIdAndUpdate(targetId, updates, { new: true })
    .select("-password -refreshToken -forgotPasswordToken -emailVerifyToken")
    .lean();
  if (!user) throw new AppError("User not found", 404);
  return user;
}

export async function createUserByAdmin(body: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  role?: string;
  isVerified?: boolean;
}) {
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const confirm_password = String(body.confirm_password ?? "");

  if (!name) throw new AppError("Tên không được để trống", 422);
  if (!email) throw new AppError("Email không được để trống", 422);
  if (!password) throw new AppError("Mật khẩu không được để trống", 422);
  if (!confirm_password) throw new AppError("Xác nhận mật khẩu không được để trống", 422);

  if (password.length < 6) throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 422);
  if (!/[A-Z]/.test(password)) throw new AppError("Mật khẩu phải có ít nhất 1 chữ viết hoa", 422);
  if (!/[0-9]/.test(password)) throw new AppError("Mật khẩu phải có ít nhất 1 chữ số", 422);

  if (password !== confirm_password) throw new AppError("Xác nhận mật khẩu không khớp", 422);

  if (!email.includes("@")) throw new AppError("Email không hợp lệ", 422);

  const role = body.role ?? "customer";
  if (!["customer", "worker", "admin"].includes(role)) {
    throw new AppError("Vai trò không hợp lệ", 422);
  }

  const isVerified = body.isVerified ?? false;

  const existed = await userModel.findOne({ email });
  if (existed) throw new AppError("Email đã tồn tại", 422);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    name,
    email,
    password: hashedPassword,
    role,
    isVerified: Boolean(isVerified),
  });

  const safeUser = await userModel
    .findById(user._id)
    .select("-password -refreshToken -forgotPasswordToken -emailVerifyToken")
    .lean();

  if (!safeUser) throw new AppError("Không tạo được người dùng", 500);
  return safeUser;
}

export async function listJobs(params: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}) {
  const { page, limit, status, search } = params;
  const q: Record<string, unknown> = {};
  if (status && ["open", "partial", "full", "done"].includes(status)) {
    q.status = status;
  }
  if (search?.trim()) {
    const esc = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q.$or = [
      { title: new RegExp(esc, "i") },
      { description: new RegExp(esc, "i") },
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    jobModel
      .find(q)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    jobModel.countDocuments(q),
  ]);
  return { items, total, page, limit };
}

export async function updateJob(
  jobId: string,
  body: {
    status?: string;
    title?: string;
    description?: string;
    price?: number;
  },
) {
  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!["open", "partial", "full", "done"].includes(body.status)) {
      throw new AppError("Invalid status", 400);
    }
    updates.status = body.status;
  }
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined)
    updates.description = String(body.description);
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (!Number.isFinite(p) || p < 0) throw new AppError("Invalid price", 400);
    updates.price = p;
  }
  if (Object.keys(updates).length === 0)
    throw new AppError("No valid fields", 400);
  const job = await jobModel
    .findByIdAndUpdate(jobId, updates, { new: true })
    .populate("createdBy", "name email role")
    .lean();
  if (!job) throw new AppError("Job not found", 404);
  return job;
}

export async function deleteJob(jobId: string) {
  const job = await jobModel.findByIdAndDelete(jobId);
  if (!job) throw new AppError("Job not found", 404);
  await applicationModel.deleteMany({ jobId: job._id });
  return { deleted: true };
}
