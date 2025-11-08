const { v4: uuid } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../database/User");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const ALLOWED_ROLES = ["coach", "athlete", "admin"];

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const generateToken = (user) => {
  const payload = {
    sub: user.id,
    role: user.role,
    organizationId: user.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const registerUser = ({ email, password, role = "athlete", organizationId, name }) => {
  if (!email || !password) {
    throw {
      status: 400,
      message: "Both 'email' and 'password' are required",
    };
  }

  if (!ALLOWED_ROLES.includes(role)) {
    throw {
      status: 400,
      message: `Role '${role}' is not supported`,
    };
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userToInsert = {
    id: uuid(),
    email,
    password: hashedPassword,
    role,
    organizationId: organizationId || null,
    name: name || null,
  };

  const createdUser = User.createUser(userToInsert);
  const token = generateToken(createdUser);

  return {
    user: sanitizeUser(createdUser),
    token,
  };
};

const loginUser = ({ email, password }) => {
  if (!email || !password) {
    throw {
      status: 400,
      message: "Both 'email' and 'password' are required",
    };
  }

  const existingUser = User.findByEmail(email);
  if (!existingUser) {
    throw {
      status: 401,
      message: "Invalid email or password",
    };
  }

  const isValidPassword = bcrypt.compareSync(password, existingUser.password);
  if (!isValidPassword) {
    throw {
      status: 401,
      message: "Invalid email or password",
    };
  }

  const token = generateToken(existingUser);

  return {
    user: sanitizeUser(existingUser),
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};
