import { Request, Response } from "express";
import UserModel from "../../models/UserModel";
import { CreateUserRequest } from "./dtos";
import BadRequest from "../../errors/exceptions/BadRequest";

export const listUsers = async (req: Request, res: Response, next: any) => {
  const list = await UserModel.find({});
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

  const user = await UserModel.create({
    ...cur,
  });

  res.status(201).json(user);
};

export const deleteUser = async (req: Request, res: Response, next: any) => {
  const userId: string = req.params.id;

  const result = await UserModel.deleteOne({ _id: userId });

  res.json({
    status: result.ok,
  });
};
