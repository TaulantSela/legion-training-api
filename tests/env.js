// Runs before every test file (and from global-setup). The tests wipe the database they use,
// so they only run against TEST_DATABASE_URL, and only when it points at this machine or CI.
require("dotenv").config({ quiet: true });

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error("Set TEST_DATABASE_URL to a throwaway Postgres database. The tests delete everything in it.");
}

const host = new URL(url).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host) && !process.env.CI) {
  throw new Error(`Refusing to run tests against ${host}: they delete all data. Use a local database.`);
}

process.env.DATABASE_URL = url;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.CRON_SECRET = "test-cron-secret";
process.env.DISABLE_RATE_LIMIT = "1";
