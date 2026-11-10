const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { jwtSecret } = require("../config");
const { forbidden, unauthorized } = require("../errors");

// The token only carries the user id. Role and gym are read fresh, so a role change applies at once.
async function authenticate(req, _res, next) {
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  } catch {
    throw unauthorized("Your token is invalid or has expired. Log in again.");
  }

  const user = await prisma.user.findUnique({
    where: { id: String(payload.sub) },
    select: { id: true, email: true, name: true, role: true, organizationId: true, memberId: true },
  });
  if (!user) throw unauthorized("Your token is invalid or has expired. Log in again.");

  req.user = user;
  next();
}

const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw forbidden(`Only ${roles.join(" or ")} accounts can do this`);
    }
    next();
  };

module.exports = { authenticate, requireRole };
