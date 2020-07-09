export default class HttpError extends Error {
  status: number = 500;

  constructor(status?: number, message?: string) {
    super(message);

    if (status) {
      this.status = status;
    }
  }
}
