import { Request } from "express";
import { User } from "../models/UserModel";

export interface UserPrincipal extends Omit<User, "password"> {
  _id: string;
}

export interface PrincipalRequest extends Request {
  user?: UserPrincipal;
}
