const { tooManyRequests } = require("../errors");

// Fixed-window limit per client IP. It's per instance, so on serverless it's a speed bump
// against scripted sign-ups and password guessing, not a hard quota.
function rateLimit({ name, max, windowMs }) {
  const hits = new Map();

  return (req, res, next) => {
    if (process.env.DISABLE_RATE_LIMIT === "1") return next();

    const ip = req.get("x-real-ip") || req.ip || "unknown";
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) {
        for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
      }
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      throw tooManyRequests(`Too many ${name} attempts. Try again later.`);
    }
    next();
  };
}

module.exports = { rateLimit };
