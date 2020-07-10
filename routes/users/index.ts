import express from "express";
import asyncHandler from "express-async-handler";
import { registerNewUser, listUsers, deleteUser } from "./controller";
import { adminGuard, decodeJwt } from "../../auth/guards";

const router = express.Router();

router.get("/", decodeJwt, adminGuard, asyncHandler(listUsers));
router.post("/", asyncHandler(registerNewUser));
router.delete("/:id", decodeJwt, adminGuard, asyncHandler(deleteUser));

export default router;
