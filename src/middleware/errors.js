const { Prisma } = require("@prisma/client");
const { HttpError } = require("../errors");

const fail = (res, status, error, details) =>
  res.status(status).json({ status: "FAILED", data: details ? { error, details } : { error } });

function notFoundHandler(req, res) {
  fail(res, 404, `No route for ${req.method} ${req.path}. See /api/v1/docs for the endpoints.`);
}

// Every error leaves as JSON. Unknown errors are logged and hidden from the client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) return fail(res, err.status, err.message, err.details);

  // express.json() and Vercel's body helper both report malformed bodies
  if (err.type === "entity.parse.failed" || err.message === "Invalid JSON") {
    return fail(res, 400, "The request body isn't valid JSON");
  }
  if (err.type === "entity.too.large") return fail(res, 413, "The request body is too large");

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return fail(res, 409, "That already exists");
    if (err.code === "P2025") return fail(res, 404, "Not found");
    if (err.code === "P2003") return fail(res, 400, "That refers to something outside your gym");
  }

  console.error(`${req.method} ${req.originalUrl} failed`, err);
  return fail(res, 500, "Something went wrong on our side");
}

module.exports = { notFoundHandler, errorHandler };
