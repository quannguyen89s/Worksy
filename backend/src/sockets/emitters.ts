import userModel from "../models/user.model";
import { haversineKm } from "../utils/distance";
import { getIo } from "./io.registry";

export async function emitJobNearby(
  jobId: string,
  jobLocation: { lat: number; lng: number },
  radiusKm = 10,
) {
  const io = getIo();
  if (!io) return;
  const workers = await userModel
    .find({ role: "worker" })
    .select("_id location")
    .lean();
  for (const w of workers) {
    const lat = w.location?.lat;
    const lng = w.location?.lng;
    if (lat == null || lng == null) continue;
    const d = haversineKm({ lat, lng }, jobLocation);
    if (d <= radiusKm) {
      io.to(`user:${String(w._id)}`).emit("job:nearby", { jobId });
    }
  }
}

export function emitApplyNew(customerUserId: string, jobId: string, applyId: string) {
  const io = getIo();
  if (!io) return;
  io.to(`user:${customerUserId}`).emit("apply:new", { jobId, applyId });
}
