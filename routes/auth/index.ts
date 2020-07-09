import express from "express";
import asyncHandler from "express-async-handler";
import { loginWithUsername } from "./controller";

const router = express.Router();

router.post("/login", asyncHandler(loginWithUsername));

export default router;
