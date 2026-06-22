/**
 * Seed người dùng role `worker` — dữ liệu thật để list / đăng nhập / tương tác.
 *
 * Chạy:  npm run seed:workers
 * Cần:   MONGO_URI trong .env (cùng DB với app)
 *
 * Mật khẩu mặc định (tất cả tài khoản seed): Worker@123
 * (đổi bằng biến SEED_WORKER_PASSWORD trong .env nếu muốn)
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "node:dns";
import userModel from "../models/user.model";
import { Role } from "../constants/enum";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

/** Hà Nội / TP.HCM — tọa độ gần đúng để sau này map / lọc theo khu vực */
const LOC_HN = { lat: 21.0285, lng: 105.8542 };
const LOC_HCM = { lat: 10.7769, lng: 106.7009 };
const LOC_DN = { lat: 16.0544, lng: 108.2022 };

export const WORKER_SEED_ENTRIES = [
  {
    name: "Nguyễn Văn Minh",
    email: "seed.worker.minh@example.com",
    skills: ["Sửa điện lạnh", "Điện dân dụng", "Lắp đặt"],
    rating: 4.9,
    completedJobs: 127,
    location: LOC_HN,
    avatar: "",
  },
  {
    name: "Trần Thị Hương",
    email: "seed.worker.huong@example.com",
    skills: ["Dọn dẹp nhà", "Vệ sinh công nghiệp", "Giặt ghế sofa"],
    rating: 4.8,
    completedJobs: 94,
    location: LOC_HN,
    avatar: "",
  },
  {
    name: "Lê Đức Anh",
    email: "seed.worker.anh@example.com",
    skills: ["Sửa chữa đồ gỗ", "Thợ mộc", "Lắp kệ, tủ"],
    rating: 5.0,
    completedJobs: 56,
    location: LOC_HCM,
    avatar: "",
  },
  {
    name: "Phạm Quốc Tuấn",
    email: "seed.worker.tuan@example.com",
    skills: ["Điện nước", "Chống thấm", "Sơn sửa"],
    rating: 4.7,
    completedJobs: 203,
    location: LOC_HCM,
    avatar: "",
  },
  {
    name: "Hoàng Thị Mai",
    email: "seed.worker.mai@example.com",
    skills: ["Chăm sóc trẻ", "Giữ trẻ tại nhà", "Dọn dẹp"],
    rating: 4.9,
    completedJobs: 71,
    location: LOC_HN,
    avatar: "",
  },
  {
    name: "Võ Minh Tuấn",
    email: "seed.worker.vo.tuan@example.com",
    skills: ["Giao hàng nhanh", "Bốc xếp", "Lái xe tải nhỏ"],
    rating: 4.6,
    completedJobs: 312,
    location: LOC_DN,
    avatar: "",
  },
  {
    name: "Đặng Thu Hà",
    email: "seed.worker.ha@example.com",
    skills: ["Dạy kèm Toán", "Tiếng Anh THCS", "Ôn thi"],
    rating: 4.95,
    completedJobs: 48,
    location: LOC_HN,
    avatar: "",
  },
  {
    name: "Bùi Văn Thắng",
    email: "seed.worker.thang@example.com",
    skills: ["Sửa máy tính", "Cài Win", "Lắp mạng LAN"],
    rating: 4.85,
    completedJobs: 165,
    location: LOC_HCM,
    avatar: "",
  },
  {
    name: "Đỗ Thị Lan",
    email: "seed.worker.lan@example.com",
    skills: ["Nấu ăn tại nhà", "Tiệc nhỏ", "Meal prep"],
    rating: 4.75,
    completedJobs: 88,
    location: LOC_HN,
    avatar: "",
  },
  {
    name: "Ngô Hoài Nam",
    email: "seed.worker.nam@example.com",
    skills: ["Sửa xe máy", "Thay nhớt", "Lốp & phanh"],
    rating: 4.65,
    completedJobs: 241,
    location: LOC_DN,
    avatar: "",
  },
  {
    name: "Lý Phương Dung",
    email: "seed.worker.dung@example.com",
    skills: ["Chăm sóc người già", "Theo giờ", "Dọn dẹp"],
    rating: 4.92,
    completedJobs: 62,
    location: LOC_HCM,
    avatar: "",
  },
  {
    name: "Chu Anh Kiệt",
    email: "seed.worker.kiet@example.com",
    skills: ["Lắp đặt camera", "Mạng Wi‑Fi", "Smarthome cơ bản"],
    rating: 4.88,
    completedJobs: 119,
    location: LOC_HN,
    avatar: "",
  },
] as const;

const DEFAULT_PASSWORD = process.env.SEED_WORKER_PASSWORD ?? "Worker@123";

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Thiếu MONGO_URI trong .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Đã kết nối MongoDB");

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let created = 0;
  let updated = 0;

  for (const w of WORKER_SEED_ENTRIES) {
    const existing = await userModel.findOne({ email: w.email }).select("_id");
    const doc = {
      name: w.name,
      email: w.email,
      password: hash,
      role: Role.Worker,
      rating: w.rating,
      completedJobs: w.completedJobs,
      skills: [...w.skills],
      location: { ...w.location },
      avatar: w.avatar,
      isVerified: true,
      isDeleted: false,
      googleId: "",
      refreshToken: "",
    };

    await userModel.findOneAndUpdate(
      { email: w.email },
      { $set: doc },
      { upsert: true, new: true },
    );

    if (existing) updated += 1;
    else created += 1;
  }

  console.log(`\n✅ Seed worker xong: ${created} tạo mới, ${updated} cập nhật.`);
  console.log(`   Tổng ${WORKER_SEED_ENTRIES.length} tài khoản worker.`);
  console.log(`   Mật khẩu đăng nhập: ${DEFAULT_PASSWORD}\n`);
  console.log("   Email mẫu:");
  WORKER_SEED_ENTRIES.slice(0, 3).forEach((e) => console.log(`   - ${e.email}`));
  console.log("   ... (xem WORKER_SEED_ENTRIES trong file seed)\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
