const { PrismaClient } = require("@prisma/client");

// Reuse one client across hot reloads and warm serverless invocations
const prisma = globalThis.__legionPrisma ?? new PrismaClient();
globalThis.__legionPrisma = prisma;

module.exports = prisma;
