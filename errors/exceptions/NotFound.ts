import HttpError from "./HttpError";

export default class NotFound extends HttpError {
  constructor(message?: string) {
    super(404, message || "Not Found");
  }
}
