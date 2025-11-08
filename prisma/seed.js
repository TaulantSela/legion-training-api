const { PrismaClient } = require("@prisma/client");
const seedData = require("../src/database/db.json");

const prisma = new PrismaClient();

async function seedMembers() {
  const members = seedData.members || [];
  for (const member of members) {
    await prisma.member.upsert({
      where: { id: member.id },
      create: {
        id: member.id,
        name: member.name,
        gender: member.gender || null,
        dateOfBirth: member.dateOfBirth || null,
        email: member.email,
        password: member.password,
      },
      update: {
        name: member.name,
        gender: member.gender || null,
        dateOfBirth: member.dateOfBirth || null,
        email: member.email,
        password: member.password,
      },
    });
  }
}

async function seedWorkouts() {
  const workouts = seedData.workouts || [];
  for (const workout of workouts) {
    await prisma.workout.upsert({
      where: { id: workout.id },
      create: {
        id: workout.id,
        name: workout.name,
        mode: workout.mode || null,
        equipment: workout.equipment || [],
        exercises: workout.exercises || [],
        trainerTips: workout.trainerTips || [],
        createdAt: workout.createdAt || null,
        updatedAt: workout.updatedAt || null,
      },
      update: {
        name: workout.name,
        mode: workout.mode || null,
        equipment: workout.equipment || [],
        exercises: workout.exercises || [],
        trainerTips: workout.trainerTips || [],
        createdAt: workout.createdAt || null,
        updatedAt: workout.updatedAt || null,
      },
    });
  }
}

async function seedUsers() {
  const users = seedData.users || [];
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        password: user.password,
        role: user.role || null,
        organizationId: user.organizationId || null,
        name: user.name || null,
      },
      update: {
        email: user.email,
        password: user.password,
        role: user.role || null,
        organizationId: user.organizationId || null,
        name: user.name || null,
      },
    });
  }
}

async function seedRecords() {
  const records = seedData.records || [];
  for (const record of records) {
    await prisma.record.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        workoutId: record.workout,
        record: record.record,
        memberId: record.memberId,
      },
      update: {
        workoutId: record.workout,
        record: record.record,
        memberId: record.memberId,
      },
    });
  }
}

async function main() {
  await seedMembers();
  await seedWorkouts();
  await seedUsers();
  await seedRecords();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Prisma seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
