import { Request } from "express";
import { DocumentType } from "@typegoose/typegoose";
import { User } from "../models/UserModel";

export type UserInfo = DocumentType<Omit<User, "password">>;

export interface UserPrincipleRequest<T> extends Request {
  user: T;
}

export interface PrincipleRequest extends UserPrincipleRequest<UserInfo> {}
