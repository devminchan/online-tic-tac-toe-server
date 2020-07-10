import { Request } from "express";
import { DocumentType } from "@typegoose/typegoose";
import { User } from "../models/UserModel";

export interface UserPrinciple extends Omit<User, "password"> {
  _id: string;
}

export interface PrincipleRequest extends Request {
  user?: UserPrinciple;
}
