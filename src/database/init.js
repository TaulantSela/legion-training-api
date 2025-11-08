const prisma = require("./client");
const seedSnapshot = require("./db.json");

let initPromise = null;

async function seedMembers() {
  const members = seedSnapshot.members || [];
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
  const workouts = seedSnapshot.workouts || [];
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
  const users = seedSnapshot.users || [];
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
  const records = seedSnapshot.records || [];
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

async function seedDatabaseIfEmpty() {
  let counts;
  try {
    counts = await Promise.all([
      prisma.member.count(),
      prisma.workout.count(),
      prisma.user.count(),
      prisma.record.count(),
    ]);
  } catch (error) {
    if (error.code === "P2021") {
      throw new Error(
        "Database schema not found. Run `npm run prisma:push` to create tables before starting the API."
      );
    }
    throw error;
  }

  const [memberCount, workoutCount, userCount, recordCount] = counts;

  if (memberCount === 0) {
    await seedMembers();
  }
  if (workoutCount === 0) {
    await seedWorkouts();
  }
  if (userCount === 0) {
    await seedUsers();
  }
  if (recordCount === 0) {
    await seedRecords();
  }
}

function ensureDatabaseSetup() {
  if (!initPromise) {
    initPromise = (async () => {
      await prisma.$connect();
      await seedDatabaseIfEmpty();
    })().catch((error) => {
      initPromise = null;
      console.error("Failed to initialize database", error);
      throw error;
    });
  }
  return initPromise;
}

module.exports = { ensureDatabaseSetup };
