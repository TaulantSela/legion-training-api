// npm run db:seed — builds (or rebuilds) the demo gym
require("dotenv").config({ quiet: true });
const { resetDemoGym } = require("../src/services/demo");
const prisma = require("../src/db");
const { assertDisposableDatabase } = require("../scripts/db-guard");

// Only on this machine or the dev database; production rebuilds its demo gym every night.
assertDisposableDatabase()
  .then(() => resetDemoGym())
  .then(() => console.log("Demo gym is ready: coach@example.com / password, athlete@example.com / password"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
