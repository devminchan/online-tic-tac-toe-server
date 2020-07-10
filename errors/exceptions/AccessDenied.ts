import HttpError from "./HttpError";

export default class AccessDenined extends HttpError {
  constructor(message?: string) {
    super(403, message || "Access Denied");
  }
}
