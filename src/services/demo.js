const { randomBytes, randomUUID } = require("node:crypto");
const prisma = require("../db");
const demo = require("../demo/data");
const { hashPassword } = require("./auth");

const VISITOR_GYM_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

// Deletes the demo gym (and everyone who joined it) and builds it again from demo/data.js
async function resetDemoGym() {
  const [passwordHash, ownerHash] = await Promise.all([
    hashPassword(demo.password),
    hashPassword(randomBytes(24).toString("hex")),
  ]);
  const memberIds = Object.fromEntries(demo.members.map((member) => [member.key, randomUUID()]));
  const workoutIds = Object.fromEntries(demo.workouts.map((workout) => [workout.key, randomUUID()]));
  const demoEmails = [demo.owner.email, demo.coach.email, demo.athlete.email];

  await prisma.$transaction(
    async (tx) => {
      await tx.organization.deleteMany({ where: { slug: demo.gym.slug } });
      await tx.user.deleteMany({ where: { email: { in: demoEmails } } });

      const { id: organizationId } = await tx.organization.create({ data: demo.gym });

      await tx.member.createMany({
        data: demo.members.map(({ key, dateOfBirth, ...member }) => ({
          ...member,
          id: memberIds[key],
          organizationId,
          dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`),
        })),
      });
      await tx.workout.createMany({
        data: demo.workouts.map(({ key, ...workout }) => ({ ...workout, id: workoutIds[key], organizationId })),
      });
      await tx.record.createMany({
        data: demo.records.map((record) => ({
          organizationId,
          memberId: memberIds[record.member],
          workoutId: workoutIds[record.workout],
          result: record.result,
        })),
      });
      await tx.user.createMany({
        data: [
          { ...demo.owner, role: "admin", passwordHash: ownerHash, organizationId },
          { ...demo.coach, role: "coach", passwordHash, organizationId },
          { ...demo.athlete, role: "athlete", passwordHash, organizationId, memberId: memberIds.alex },
        ],
      });
    },
    { timeout: 20_000 },
  );
}

// Gyms that visitors open are kept for a week, so the demo database doesn't grow forever
async function pruneVisitorGyms(now = new Date()) {
  const cutoff = new Date(now.getTime() - VISITOR_GYM_TTL_DAYS * DAY_MS);
  const { count } = await prisma.organization.deleteMany({
    where: { slug: { not: demo.gym.slug }, createdAt: { lt: cutoff } },
  });
  return count;
}

async function resetDemo() {
  await resetDemoGym();
  const prunedGyms = await pruneVisitorGyms();
  return { demoGym: demo.gym.slug, prunedGyms };
}

module.exports = { resetDemo, resetDemoGym, pruneVisitorGyms, VISITOR_GYM_TTL_DAYS };
