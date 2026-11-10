const request = require("supertest");
const { app } = require("../src/app");
const prisma = require("../src/db");
const { resetDemoGym } = require("../src/services/demo");
const { hashPassword } = require("../src/services/auth");

const api = () => request(app);
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// The demo gym from src/demo/data.js, plus a second gym to prove tenants can't see each other
async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE "Record", "User", "Member", "Workout", "Organization" CASCADE');
  await resetDemoGym();

  const gym = await prisma.organization.create({
    data: { name: "Rival Gym", slug: "rival-gym", inviteCode: "RIVL-0001" },
  });
  const member = await prisma.member.create({
    data: { organizationId: gym.id, name: "Riley Rival", email: "riley@example.com" },
  });
  const workout = await prisma.workout.create({
    data: { organizationId: gym.id, name: "Rival WOD", mode: "AMRAP 5", equipment: ["kettlebell"], exercises: ["10 swings"] },
  });
  const record = await prisma.record.create({
    data: { organizationId: gym.id, memberId: member.id, workoutId: workout.id, result: "5 rounds" },
  });
  await prisma.user.create({
    data: {
      email: "rival.coach@example.com",
      name: "Rival Coach",
      role: "coach",
      passwordHash: await hashPassword("password"),
      organizationId: gym.id,
    },
  });

  const demoGym = await prisma.organization.findUniqueOrThrow({ where: { slug: "legion-demo" } });
  return { demoGym, rival: { gym, member, workout, record } };
}

async function login(email, password = "password") {
  const response = await api().post("/api/v1/auth/login").send({ email, password });
  if (response.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(response.body)}`);
  return response.body.data.token;
}

const demoWorkout = (name) => prisma.workout.findFirstOrThrow({ where: { name, organization: { slug: "legion-demo" } } });
const demoMember = (email) => prisma.member.findFirstOrThrow({ where: { email, organization: { slug: "legion-demo" } } });

// An admin of a fresh gym, made through the public sign-up
async function openGym(gymName = "Iron Temple", email = "sam@example.com") {
  const response = await api()
    .post("/api/v1/auth/register-gym")
    .send({ gymName, name: "Sam Owner", email, password: "a-long-password" });
  if (response.status !== 201) throw new Error(`Couldn't open a gym: ${JSON.stringify(response.body)}`);
  return response.body.data;
}

afterAll(() => prisma.$disconnect());

module.exports = { api, bearer, prisma, resetDatabase, login, demoWorkout, demoMember, openGym };
