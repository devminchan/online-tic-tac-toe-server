import { Request, Response } from "express";
import UserModel from "../../models/UserModel";
import { CreateUserRequest } from "./dtos";
import BadRequest from "../../errors/exceptions/BadRequest";
import NotFound from "../../errors/exceptions/NotFound";
import bcrypt from "bcrypt";

export const listUsers = async (req: Request, res: Response, next: any) => {
  const list = await UserModel.find().select(["-password"]);
  res.json(list);
};

export const registerNewUser = async (
  req: Request,
  res: Response,
  next: any
) => {
  const cur = req.body as CreateUserRequest;

  if (
    !cur.username ||
    cur.username.trim().length < 3 ||
    cur.username.trim().length > 16
  ) {
    throw new BadRequest("username must be longer than 3 and shorter than 16");
  }

  if (!cur.password || cur.password.trim().length < 8) {
    throw new BadRequest("password must be longer than 8");
  }

  const hashedPassword = await bcrypt.hash(cur.password, 10); // 패스워드 암호화

  const user = await UserModel.create({
    ...cur,
    password: hashedPassword,
  });

  const { password, ...userInfo } = user.toJSON();

  res.status(201).json(userInfo);
};

export const deleteUser = async (req: Request, res: Response, next: any) => {
  const userId: string = req.params.id;

  const result = await UserModel.deleteOne({ _id: userId });

  if (result.deletedCount && result.deletedCount > 0) {
    res.status(200).json({
      message: "Ok",
    });
  } else {
    throw new NotFound("User not found");
  }
};
