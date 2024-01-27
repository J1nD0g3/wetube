import express from "express";
import { logout, see, startGithubLogin, finishGithubLogin, postEdit, getEdit, getChangePassword, postChangePassword } from "../controllers/usercontroller";
import { protectorMiddleware, publicOnlyMiddleware, uploadAvatar } from "../middleware";

const userRouter = express.Router();

userRouter.route("/edit").all(protectorMiddleware).get(getEdit).post(uploadAvatar.single('avatar') ,postEdit);
userRouter.get("/logout", protectorMiddleware, logout);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);
userRouter.route("/change-password").all(protectorMiddleware).get(getChangePassword).post(postChangePassword);
userRouter.get("/:id", see);

export default userRouter;