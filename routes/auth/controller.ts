import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginRequest } from "./dtos";
import UserModel from "../../models/UserModel";
import NotFound from "../../errors/exceptions/NotFound";
import BadRequest from "../../errors/exceptions/BadRequest";
import { JWT_SECRET } from "../../constrants";

export const loginWithUsername = async (
  req: Request,
  res: Response,
  next: any
) => {
  const lr = req.body as LoginRequest;

  const targetUser = await UserModel.findOne({ username: lr.username });

  if (!targetUser) {
    throw new NotFound("user not found");
  }

  const isCorrect = await bcrypt.compare(lr.password, targetUser.password);

  if (isCorrect) {
    const token = jwt.sign(
      {
        _id: targetUser._id,
        username: targetUser.username,
      },
      JWT_SECRET
    );

    res.send({
      message: "login success!",
      token,
    });
  } else {
    throw new BadRequest("wrong password");
  }
};
