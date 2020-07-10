import express from "express";
import asyncHandler from "express-async-handler";
import {
  registerNewUser,
  listUsers,
  deleteUser,
  getMyInfo,
  deleteMe,
} from "./controller";
import { adminGuard, decodeJwt, userGuard } from "../../auth/guards";

const router = express.Router();

router.get("/me", decodeJwt, userGuard, asyncHandler(getMyInfo));
router.delete("/me", decodeJwt, userGuard, asyncHandler(deleteMe));
router.delete("/:id", decodeJwt, adminGuard, asyncHandler(deleteUser));
router.get("/", decodeJwt, adminGuard, asyncHandler(listUsers));
router.post("/", asyncHandler(registerNewUser));

export default router;
