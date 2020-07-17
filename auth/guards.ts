import jwt from "express-jwt";
import { Response, NextFunction } from "express";
import { JWT_SECRET } from "../constrants";
import { PrincipalRequest } from ".";
import AccessDenined from "../errors/exceptions/AccessDenied";
import { Unauthorized } from "../errors/exceptions/Unauthorized";

export const decodeJwt = jwt({ secret: JWT_SECRET, algorithms: ["HS256"] });

export const userGuard = (
  req: PrincipalRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new Unauthorized("wrong user info");
  } else {
    next();
  }
};

export const adminGuard = (
  req: PrincipalRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.isAdmin) {
    throw new AccessDenined("require admin authorization");
  } else {
    next();
  }
};
