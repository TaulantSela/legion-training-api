// npm run db:seed — builds (or rebuilds) the demo gym
const { resetDemoGym } = require("../src/services/demo");
const prisma = require("../src/db");

resetDemoGym()
  .then(() => console.log("Demo gym is ready: coach@example.com / password, athlete@example.com / password"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
