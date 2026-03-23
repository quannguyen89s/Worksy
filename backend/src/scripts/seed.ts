import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db";
import User from "../models/user.model";
import Job from "../models/job.model";
import Application from "../models/application.model";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import Notification from "../models/notification.model";

const APPEND = process.argv.includes("--append");

async function clearAll(): Promise<void> {
  await Message.deleteMany({});
  await Notification.deleteMany({});
  await Conversation.deleteMany({});
  await Application.deleteMany({});
  await Job.deleteMany({});
  await User.deleteMany({});
  console.log("Đã xoá dữ liệu cũ (users, jobs, applications, conversations, messages, notifications).");
}

async function seed(): Promise<void> {
  await connectDB();

  if (!APPEND) {
    await clearAll();
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const customer = await User.create({
    name: "Diễm Vi",
    email: "duongthidiemvi2004@gmail.com",
    password: passwordHash,
    role: "customer",
    avatar: "",
    isVerified: true,
  });

  const worker = await User.create({
    name: "Vi Vi",
    email: "vidtdde180752@fpt.edu.vn",
    password: passwordHash,
    role: "worker",
    avatar: "",
    isVerified: true,
  });

  const worker2 = await User.create({
    name: "dương vi",
    email: "diemvi20042007@gmail.com",
    password: passwordHash,
    role: "worker",
    avatar: "",
    isVerified: true,
  });

  const job1 = await Job.create({
    title: "Lắp đặt điều hòa tại Q1",
    description: "Cần thợ có kinh nghiệm lắp đặt máy lạnh inverter.",
    price: 1500000,
    location: { lat: 10.7769, lng: 106.7009 },
    requiredWorkers: 1,
    assignedWorkers: 0,
    skillTags: ["dien-lanh", "lap-dat"],
    status: "open",
    createdBy: customer._id,
    assignedTo: null,
  });

  const job2 = await Job.create({
    title: "Sửa ống nước gấp",
    description: "Rò rỉ tại nhà vệ sinh, cần xử lý trong ngày.",
    price: 500000,
    location: { lat: 10.7808, lng: 106.6992 },
    requiredWorkers: 1,
    assignedWorkers: 1,
    assignedWorkerIds: [worker._id],
    skillTags: ["dien-nuoc", "sua-chua"],
    status: "full",
    createdBy: customer._id,
    assignedTo: worker._id,
  });

  await Application.create({
    jobId: job1._id,
    workerId: worker._id,
    message: "Em có 3 năm kinh nghiệm, xin nhận job ạ.",
    status: "pending",
  });

  await Application.create({
    jobId: job1._id,
    workerId: worker2._id,
    message: "Báo giá khảo sát miễn phí.",
    status: "pending",
  });

  const sortedParticipants = [customer._id.toString(), worker._id.toString()].sort();
  const conv = await Conversation.create({
    participants: sortedParticipants.map((id) => new mongoose.Types.ObjectId(id)),
    jobId: job2._id,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: new Map([
      [customer._id.toString(), 0],
      [worker._id.toString(), 0],
    ]),
  });

  const msg1 = await Message.create({
    conversationId: conv._id,
    senderId: customer._id,
    content: "Chào anh, khi nào anh qua được nhà em?",
    type: "text",
    isRead: true,
    readAt: new Date(),
  });

  const msg2 = await Message.create({
    conversationId: conv._id,
    senderId: worker._id,
    content: "Chiều nay 15h em tới nhé.",
    type: "text",
    isRead: false,
    readAt: null,
  });

  const unread = new Map<string, number>([
    [customer._id.toString(), 0],
    [worker._id.toString(), 1],
  ]);

  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: msg2._id,
    lastMessageAt: new Date(),
    unreadCount: unread,
  });

  await Notification.create({
    userId: customer._id,
    type: "job_application",
    title: "Ứng viên mới",
    body: "Có worker ứng tuyển job lắp đặt điều hòa.",
    data: { jobId: job1._id.toString() },
    isRead: false,
    readAt: null,
  });

  await Notification.create({
    userId: worker._id,
    type: "new_message",
    title: "Tin nhắn mới",
    body: "Bạn có tin nhắn trong cuộc trò chuyện.",
    data: { conversationId: conv._id.toString() },
    isRead: false,
    readAt: null,
  });

  console.log("\n========== SEED HOÀN TẤT ==========\n");
  console.log("Đăng nhập test (mật khẩu: Password123!):");
  console.log("  Customer:", customer.email);
  console.log("  Worker:  ", worker.email);
  console.log("  Worker2: ", worker2.email);
  console.log("\n_id dùng cho JWT (payload id là string):");
  console.log("  customer._id:", customer._id.toString());
  console.log("  worker._id:  ", worker._id.toString());
  console.log("\nJob / Conversation:");
  console.log("  job1 (open):     ", job1._id.toString());
  console.log("  job2 (full):     ", job2._id.toString());
  console.log("  conversation:    ", conv._id.toString());
  console.log("\nChạy lại từ đầu: npm run seed -- --reset\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
