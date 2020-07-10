import HttpError from "./HttpError";

export class Unauthorized extends HttpError {
  constructor(message?: string) {
    super(401, message || "Unauthorized");
  }
}
