// Runs first in `npm run db:migrate` (see db-guard.js). It reads the same .env as Prisma does.
require("dotenv").config({ quiet: true });
const { assertDisposableDatabase } = require("./db-guard");

assertDisposableDatabase().then(
  (checked) => console.log(`Dev database: ${checked.join(", ")}`),
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
