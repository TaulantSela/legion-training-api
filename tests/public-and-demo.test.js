const { api, bearer, prisma, resetDatabase, login, demoWorkout, openGym } = require("./helpers");
const { pruneVisitorGyms } = require("../src/services/demo");

beforeEach(resetDatabase);

describe("public catalogue", () => {
  test("the demo gym's workouts are readable without a token", async () => {
    const gym = await api().get("/api/v1/gyms/legion-demo");
    const list = await api().get("/api/v1/gyms/legion-demo/workouts?limit=2");
    const random = await api().get("/api/v1/gyms/legion-demo/workouts/random?mode=amrap");

    expect(gym.body.data).toEqual({ name: "Legion Demo Gym", slug: "legion-demo" });
    expect(list.body.meta.total).toBe(7);
    expect(random.body.data.mode).toMatch(/AMRAP/);
  });

  test("gyms that haven't opted in are a 404", async () => {
    expect((await api().get("/api/v1/gyms/rival-gym/workouts")).status).toBe(404);
    expect((await api().get("/api/v1/gyms/no-such-gym")).status).toBe(404);
  });
});

describe("nightly demo reset", () => {
  const reset = () => api().get("/api/v1/internal/reset-demo");

  test("needs the cron secret", async () => {
    expect((await reset()).status).toBe(401);
    expect((await reset().set(bearer("wrong"))).status).toBe(401);
  });

  test("puts back what visitors changed and removes who joined", async () => {
    const coach = await login("coach@example.com");
    const tommyV = await demoWorkout("Tommy V");
    await api().patch(`/api/v1/workouts/${tommyV.id}`).set(bearer(coach)).send({ name: "Vandalised" });
    await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: "LEGION-DEMO", name: "Visitor", email: "visitor@example.com", password: "a-long-password" });

    const response = await reset().set(bearer("test-cron-secret"));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ demoGym: "legion-demo", prunedGyms: 0 });
    expect(await prisma.workout.count({ where: { name: "Vandalised" } })).toBe(0);
    expect(await prisma.user.findUnique({ where: { email: "visitor@example.com" } })).toBeNull();
    expect((await api().post("/api/v1/auth/login").send({ email: "coach@example.com", password: "password" })).status).toBe(200);
  });

  test("keeps the rival gym and new visitor gyms, prunes ones older than a week", async () => {
    await openGym("Fresh Gym", "fresh@example.com");
    const old = await openGym("Old Gym", "old@example.com");
    await prisma.organization.update({
      where: { id: old.gym.id },
      data: { createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
    });

    expect(await pruneVisitorGyms()).toBe(1);
    expect(await prisma.organization.findUnique({ where: { id: old.gym.id } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { email: "old@example.com" } })).toBeNull();
    expect(await prisma.organization.count({ where: { slug: { in: ["fresh-gym", "rival-gym", "legion-demo"] } } })).toBe(3);
  });
});
