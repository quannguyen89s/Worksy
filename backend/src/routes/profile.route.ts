import { Router } from "express";
import { getProfileController, updateProfileController, changePasswordController, uploadAvatarController } from "../controllers/profile.controller";
import { authenticateToken } from "../middlewares/auth.middlewares";
import { updateProfileValidator, changePasswordValidator } from "../middlewares/profile.middlewares";
import { uploadAvatar } from "../middlewares/upload.middlewares";

const profileRouter = Router();

profileRouter.get("/", authenticateToken, getProfileController);
profileRouter.patch("/", authenticateToken, updateProfileValidator, updateProfileController);
profileRouter.patch("/change-password", authenticateToken, changePasswordValidator, changePasswordController);
profileRouter.post("/upload-avatar", authenticateToken, uploadAvatar, uploadAvatarController);

export default profileRouter;
