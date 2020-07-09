import express from "express";
import asyncHandler from "express-async-handler";
import { registerNewUser, listUsers, deleteUser } from "./controller";

const router = express.Router();

router.get("/", asyncHandler(listUsers));
router.post("/", asyncHandler(registerNewUser));
router.delete("/:id", asyncHandler(deleteUser));

export default router;
