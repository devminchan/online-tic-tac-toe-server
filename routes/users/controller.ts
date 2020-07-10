import { Request, Response } from "express";
import UserModel from "../../models/UserModel";
import { CreateUserRequest } from "./dtos";
import BadRequest from "../../errors/exceptions/BadRequest";
import NotFound from "../../errors/exceptions/NotFound";
import bcrypt from "bcrypt";
import { PrincipleRequest } from "../../auth";

export const listUsers = async (req: Request, res: Response) => {
  const list = await UserModel.find().select(["-password"]);
  res.json(list);
};

export const getMyInfo = async (req: PrincipleRequest, res: Response) => {
  const _id = req.user?._id;

  const user = await UserModel.findById(_id);

  if (!user) {
    throw new NotFound("user not found");
  }

  const { password, ...userInfo } = user.toJSON();
  res.send(userInfo);
};

export const registerNewUser = async (req: Request, res: Response) => {
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

  const found = await UserModel.findOne({ username: cur.username });

  if (found) {
    throw new BadRequest("username already exists!");
  }

  const userLength = await UserModel.count({});

  // 처음 생성 되었을 때, 어드민 권한을 부여
  let isAdmin = false;
  if (userLength === 0) {
    isAdmin = true;
  }

  const user = await UserModel.create({
    ...cur,
    password: hashedPassword,
    isAdmin,
  });

  const { password, ...userInfo } = user.toJSON();
  res.status(201).json(userInfo);
};

export const deleteMe = async (req: PrincipleRequest, res: Response) => {
  const userId: string = req.user!._id;

  const result = await UserModel.deleteOne({ _id: userId });

  if (result.deletedCount && result.deletedCount > 0) {
    res.status(200).json({
      message: "Ok",
    });
  } else {
    throw new NotFound("user not found");
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userId: string = req.params.id;

  const result = await UserModel.deleteOne({ _id: userId });

  if (result.deletedCount && result.deletedCount > 0) {
    res.status(200).json({
      message: "Ok",
    });
  } else {
    throw new NotFound("user not found");
  }
};
