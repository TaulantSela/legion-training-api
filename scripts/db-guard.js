// The commands that change a database from a laptop (`npm run db:migrate` and `npm run db:seed`)
// only run on a database on this machine (like the tests, see tests/env.js) or on one marked as a
// disposable dev database. Production is never marked, so if .env ever points at it, they stop
// instead of changing it. Production gets its migrations from its own build (the vercel-build
// script runs `prisma migrate deploy` directly) and its demo gym from the nightly reset, so
// neither goes through this check.
//
// The mark is a comment on the database itself, so it holds whichever connection string leads
// there. To mark a remote dev database (never production), run this once against it, e.g. in
// Neon's SQL editor:
//   COMMENT ON DATABASE neondb IS 'legion-training:disposable';
const { PrismaClient } = require("@prisma/client");

const DISPOSABLE_MARK = "legion-training:disposable";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

// Throws unless every database the environment points at (DATABASE_URL, and
// DATABASE_URL_UNPOOLED if set) is on this machine or marked as disposable.
// Returns what it checked.
async function assertDisposableDatabase(env = process.env) {
  const urls = [...new Set([env.DATABASE_URL, env.DATABASE_URL_UNPOOLED].filter(Boolean))];
  if (urls.length === 0) throw new Error("DATABASE_URL isn't set (see .env.example).");

  const checked = [];
  for (const url of urls) {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
    if (LOCAL_HOSTS.includes(host)) {
      checked.push(`${host} (this machine)`);
      continue;
    }
    const prisma = new PrismaClient({ datasourceUrl: url });
    try {
      const [row] = await prisma.$queryRawUnsafe(
        "select datname as name, shobj_description(oid, 'pg_database') as mark from pg_database where datname = current_database()",
      );
      const where = `${host.split(".")[0]}/${row?.name ?? "?"}`;
      if (row?.mark !== DISPOSABLE_MARK) {
        throw new Error(
          `Refusing to touch ${where}: it isn't on this machine or marked as a disposable dev database, and production never is.\n` +
            "Point DATABASE_URL in .env at a local database or at legion-training-dev (see the README).",
        );
      }
      checked.push(where);
    } finally {
      await prisma.$disconnect();
    }
  }
  return checked;
}

module.exports = { DISPOSABLE_MARK, assertDisposableDatabase };
