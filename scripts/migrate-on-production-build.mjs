// Vercel runs this as the `vercel-build` script when it builds the API. On production builds
// it applies pending migrations to the production database (`prisma migrate deploy`: applies
// new migrations in order, never resets anything), so a merged PR's migrations reach
// production with its code. Previews (they use the dev database) and local runs skip it.
//
// It migrates over the direct connection (DATABASE_URL_UNPOOLED) when there is one: Prisma
// Migrate holds a lock for the whole run, which Neon's pooler doesn't keep.
//
// If a migration fails, the build fails and the current production deployment stays live.
// Migrations run while the previous version is still serving, so keep them backward-compatible:
// add columns and tables first, and remove what the old code still reads in a later release.
import { execFileSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production") {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Production build without DATABASE_URL.");
  console.log("Production build: applying pending migrations (prisma migrate deploy).");
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
} else {
  console.log(`Not a production build (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}): no migrations.`);
}
