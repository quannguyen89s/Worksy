import mongoose from "mongoose";
import { Role } from "../constants/enum";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    rating: {
      type: Number,
      default: 3.5,
      min: 0,
      max: 5,
    },
    completedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    skills: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      default: Role.Customer,
    },
    avatar: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    forgotPasswordOTP: {
      type: String,
      default: "",
    },
    forgotPasswordOTPExpiry: {
      type: Date,
      default: null,
    },
    emailVerifyToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const userModel = mongoose.model("User", userSchema);

export default userModel;
