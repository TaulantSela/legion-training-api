require("dotenv").config({ quiet: true });

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set. Copy .env.example to .env and fill it in.");
}

module.exports = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  // Vercel Cron sends this as a bearer token. Without it the reset endpoint stays locked.
  cronSecret: process.env.CRON_SECRET || null,
  port: Number(process.env.PORT) || 3000,
};
