import { Request, Response } from "express";
import HttpError from "./exceptions/HttpError";
import NotFound from "./exceptions/NotFound";

export const handle404Error = (req: Request, res: Response<any>, next: any) => {
  throw new NotFound();
};

export const handleError = (
  err: any,
  req: Request,
  res: Response<any>,
  next: any
) => {
  console.error(err);

  if (err instanceof HttpError) {
    res.status(err.status).send({
      message: err.message,
    });
  } else {
    res.status(500).send({
      message: "An error occured!",
    });
  }
};
