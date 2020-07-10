import jwt from "express-jwt";
import { Response, RequestHandler, NextFunction, Request } from "express";
import { compose } from "compose-middleware";
import { JWT_SECRET } from "../constrants";
import { PrincipleRequest } from ".";
import AccessDenined from "../errors/exceptions/AccessDenied";
import { Unauthorized } from "../errors/exceptions/Unauthorized";

export const decodeJwt = jwt({ secret: JWT_SECRET, algorithms: ["HS256"] });

export const userGuard = (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as PrincipleRequest;

  if (!req.user) {
    throw new AccessDenined("wrong user info");
  } else {
    next();
  }
};

export const adminGuard = (_req: Request, res: Response, next: any) => {
  const req = _req as PrincipleRequest;

  if (!req.user || !req.user.isAdmin) {
    throw new AccessDenined("require admin authorization");
  } else {
    next();
  }
};
