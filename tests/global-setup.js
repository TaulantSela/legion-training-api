const { execSync } = require("node:child_process");

// Applies any pending migrations to the test database. On a fresh database (as in CI) this runs
// every migration from scratch, so the migrations are tested too. Each test then empties the tables.
module.exports = () => {
  require("./env");
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "pipe" });
};
