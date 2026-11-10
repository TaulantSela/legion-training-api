class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = {
  HttpError,
  badRequest: (message, details) => new HttpError(400, message, details),
  unauthorized: (message = "Sign in first: send an Authorization: Bearer <token> header") =>
    new HttpError(401, message),
  forbidden: (message = "Your role can't do this") => new HttpError(403, message),
  notFound: (message) => new HttpError(404, message),
  conflict: (message) => new HttpError(409, message),
  tooManyRequests: (message) => new HttpError(429, message),
};
