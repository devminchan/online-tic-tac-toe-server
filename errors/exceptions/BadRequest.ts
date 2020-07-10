import HttpError from "./HttpError";

export default class BadRequest extends HttpError {
  constructor(message?: string) {
    super(400, message || "Bad Request");
  }
}
