import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

const JWT_SECRET = () => process.env.JWT_SECRET ?? "";

export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<{
  token: string;
  user: { id: string; email: string; name: string; role: string };
} | null> {
  const normalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  const id = user._id.toString();
  const token = jwt.sign(
    { id, role: user.role },
    JWT_SECRET(),
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
