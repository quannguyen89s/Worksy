import mongoose from "mongoose";
import { Role, UserVerifyStatus } from "../constants/enum";

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
    },
    role: {
      type: String,
      default: Role.Customer,
    },
    avatar: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: UserVerifyStatus.Unverified,
    },
    forgotPasswordToken: {
      type: String,
      default: "",
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
