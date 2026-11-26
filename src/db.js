const { PrismaClient } = require("@prisma/client");

// Neon suspends the database after a few idle minutes, and waking it can take longer than
// Prisma's default 5 s connect timeout: the first request after a quiet spell then fails with
// "Can't reach database server". Allow 15 s, unless the URL sets its own connect_timeout.
function withConnectTimeout(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("connect_timeout")) return url;
    parsed.searchParams.set("connect_timeout", "15");
    return parsed.toString();
  } catch {
    return url;
  }
}

// Reuse one client across hot reloads and warm serverless invocations
const prisma =
  globalThis.__legionPrisma ?? new PrismaClient({ datasourceUrl: withConnectTimeout(process.env.DATABASE_URL) });
globalThis.__legionPrisma = prisma;

module.exports = prisma;
