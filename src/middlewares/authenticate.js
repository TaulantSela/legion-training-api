const jwt = require("jsonwebtoken");
const User = require("../database/User");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (!token || scheme !== "Bearer") {
    res.status(401).send({
      status: "FAILED",
      data: { error: "Authentication token missing or malformed" },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = User.getOneUser(decoded.sub);
    req.user = {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    res.status(401).send({
      status: "FAILED",
      data: { error: "Invalid or expired authentication token" },
    });
  }
};

module.exports = authenticate;
