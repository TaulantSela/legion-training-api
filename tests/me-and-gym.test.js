const { api, bearer, prisma, resetDatabase, login, demoWorkout, openGym } = require("./helpers");

beforeEach(resetDatabase);

describe("/me", () => {
  test("shows the user, their gym and member profile", async () => {
    const response = await api().get("/api/v1/me").set(bearer(await login("athlete@example.com")));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      email: "athlete@example.com",
      role: "athlete",
      gym: { name: "Legion Demo Gym", slug: "legion-demo" },
      member: { name: "Alex Athlete", email: "athlete@example.com" },
    });
  });

  test("an athlete logs their own result, and logging again replaces it", async () => {
    const token = await login("athlete@example.com");
    const heavyDT = await demoWorkout("Heavy DT");

    const first = await api().put(`/api/v1/me/records/${heavyDT.id}`).set(bearer(token)).send({ result: "8:15" });
    const second = await api().put(`/api/v1/me/records/${heavyDT.id}`).set(bearer(token)).send({ result: "7:58" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data).toMatchObject({ id: first.body.data.id, result: "7:58", member: { name: "Alex Athlete" } });

    const mine = await api().get("/api/v1/me/records").set(bearer(token));
    expect(mine.body.data.map((record) => [record.workout.name, record.result]).sort()).toEqual([
      ["Burpee Meters", "14:05"],
      ["Heavy DT", "7:58"],
      ["Tommy V", "9:41"],
    ]);

    // The coach sees it on the leaderboard
    const board = await api().get(`/api/v1/workouts/${heavyDT.id}/records`).set(bearer(await login("coach@example.com")));
    expect(board.body.data.map((record) => record.result).sort()).toEqual(["7:23", "7:58"]);
  });

  test("an account without a member profile has nothing to log against", async () => {
    const token = await login("coach@example.com");
    const heavyDT = await demoWorkout("Heavy DT");

    expect((await api().get("/api/v1/me/records").set(bearer(token))).status).toBe(409);
    expect((await api().put(`/api/v1/me/records/${heavyDT.id}`).set(bearer(token)).send({ result: "1" })).status).toBe(409);
  });

  test("an unknown workout is a 404, an empty result a 400", async () => {
    const token = await login("athlete@example.com");
    const heavyDT = await demoWorkout("Heavy DT");

    expect((await api().put("/api/v1/me/records/nope").set(bearer(token)).send({ result: "1" })).status).toBe(404);
    expect((await api().put(`/api/v1/me/records/${heavyDT.id}`).set(bearer(token)).send({ result: " " })).status).toBe(400);
  });
});

describe("/gym", () => {
  test("staff see the invite code, athletes don't", async () => {
    const coach = await api().get("/api/v1/gym").set(bearer(await login("coach@example.com")));
    const athlete = await api().get("/api/v1/gym").set(bearer(await login("athlete@example.com")));

    expect(coach.body.data.inviteCode).toBe("LEGION-DEMO");
    expect(athlete.body.data).not.toHaveProperty("inviteCode");
    expect(athlete.body.data.name).toBe("Legion Demo Gym");
  });

  test("an admin renames the gym and publishes its catalogue", async () => {
    const { token, gym } = await openGym();
    expect((await api().get(`/api/v1/gyms/${gym.slug}/workouts`)).status).toBe(404);

    const response = await api().patch("/api/v1/gym").set(bearer(token)).send({ name: "Iron Temple North", publicCatalog: true });

    expect(response.body.data).toMatchObject({ name: "Iron Temple North", publicCatalog: true, slug: gym.slug });
    expect((await api().get(`/api/v1/gyms/${gym.slug}/workouts`)).status).toBe(200);
  });

  test("rotating the invite code retires the old one", async () => {
    const { token, gym } = await openGym();
    const rotated = await api().post("/api/v1/gym/invite-code").set(bearer(token));

    expect(rotated.body.data.inviteCode).not.toBe(gym.inviteCode);
    const withOldCode = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: gym.inviteCode, name: "Late", email: "late@example.com", password: "a-long-password" });
    expect(withOldCode.status).toBe(400);
  });

  test("only admins change gym settings", async () => {
    const coach = await login("coach@example.com");

    expect((await api().patch("/api/v1/gym").set(bearer(coach)).send({ name: "Mine now" })).status).toBe(403);
    expect((await api().post("/api/v1/gym/invite-code").set(bearer(coach))).status).toBe(403);
    expect((await api().get("/api/v1/users").set(bearer(coach))).status).toBe(403);
  });
});

describe("/users", () => {
  test("an admin lists their gym's users and promotes an athlete", async () => {
    const { token, gym } = await openGym();
    const joined = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: gym.inviteCode, name: "Pat Athlete", email: "pat@example.com", password: "a-long-password" });

    const users = await api().get("/api/v1/users").set(bearer(token));
    expect(users.body.data.map((user) => [user.email, user.role])).toEqual([
      ["sam@example.com", "admin"],
      ["pat@example.com", "athlete"],
    ]);

    const promoted = await api().patch(`/api/v1/users/${joined.body.data.user.id}`).set(bearer(token)).send({ role: "coach" });
    expect(promoted.body.data.role).toBe("coach");

    const patToken = await login("pat@example.com", "a-long-password");
    const created = await api().post("/api/v1/workouts").set(bearer(patToken)).send({ name: "Pat's WOD", mode: "EMOM 10", exercises: ["5 cleans"] });
    expect(created.status).toBe(201);
  });

  test("an admin can't change their own role or someone in another gym", async () => {
    const { token, user } = await openGym();
    const otherGymCoach = await prisma.user.findUniqueOrThrow({ where: { email: "coach@example.com" } });

    expect((await api().patch(`/api/v1/users/${user.id}`).set(bearer(token)).send({ role: "athlete" })).status).toBe(400);
    expect((await api().patch(`/api/v1/users/${otherGymCoach.id}`).set(bearer(token)).send({ role: "athlete" })).status).toBe(404);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: otherGymCoach.id } })).role).toBe("coach");
  });

  test("rejects an unknown role", async () => {
    const { token, gym } = await openGym();
    const joined = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: gym.inviteCode, name: "Pat", email: "pat@example.com", password: "a-long-password" });

    const response = await api().patch(`/api/v1/users/${joined.body.data.user.id}`).set(bearer(token)).send({ role: "owner" });
    expect(response.status).toBe(400);
  });
});
