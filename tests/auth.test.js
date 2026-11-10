const { api, bearer, prisma, resetDatabase, login, demoMember } = require("./helpers");

beforeEach(resetDatabase);

describe("opening a gym", () => {
  test("creates the gym and makes the sign-up its admin", async () => {
    const response = await api()
      .post("/api/v1/auth/register-gym")
      .send({ gymName: "Iron Temple", name: "Sam Owner", email: "Sam@Example.com", password: "a-long-password" });

    expect(response.status).toBe(201);
    const { token, user, gym } = response.body.data;
    expect(token).toEqual(expect.any(String));
    expect(user).toMatchObject({ email: "sam@example.com", role: "admin", organizationId: gym.id });
    expect(gym).toMatchObject({ name: "Iron Temple", slug: "iron-temple", inviteCode: expect.stringMatching(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/) });
    expect(user).not.toHaveProperty("passwordHash");
  });

  test("gives a second gym with the same name its own slug", async () => {
    const first = await api().post("/api/v1/auth/register-gym").send({ gymName: "Iron Temple", name: "A", email: "a@example.com", password: "a-long-password" });
    const second = await api().post("/api/v1/auth/register-gym").send({ gymName: "Iron Temple", name: "B", email: "b@example.com", password: "a-long-password" });

    expect(second.status).toBe(201);
    expect(second.body.data.gym.slug).toMatch(/^iron-temple-\d{4}$/);
    expect(second.body.data.gym.id).not.toBe(first.body.data.gym.id);
  });

  test("refuses a role in the body instead of ignoring it", async () => {
    const response = await api()
      .post("/api/v1/auth/register-gym")
      .send({ gymName: "Sneaky", name: "S", email: "s@example.com", password: "a-long-password", role: "admin" });

    expect(response.status).toBe(400);
    expect(response.body.data.details).toEqual([{ field: null, message: 'Unrecognized key: "role"' }]);
  });

  test("rejects an email that already has an account", async () => {
    const response = await api()
      .post("/api/v1/auth/register-gym")
      .send({ gymName: "Copycat", name: "C", email: "coach@example.com", password: "a-long-password" });

    expect(response.status).toBe(409);
    expect(await prisma.organization.count({ where: { name: "Copycat" } })).toBe(0);
  });

  test("lists every invalid field", async () => {
    const response = await api().post("/api/v1/auth/register-gym").send({ gymName: "", email: "nope", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.data.details.map((issue) => issue.field).sort()).toEqual(["email", "gymName", "name", "password"]);
  });
});

describe("joining a gym as an athlete", () => {
  test("creates an athlete with a member profile in that gym", async () => {
    const response = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: "legion-demo", name: "Riley Runner", email: "riley.runner@example.com", password: "a-long-password" });

    expect(response.status).toBe(201);
    const { user, gym } = response.body.data;
    expect(user.role).toBe("athlete");
    expect(gym.slug).toBe("legion-demo");
    expect(gym).not.toHaveProperty("inviteCode");

    const member = await prisma.member.findUniqueOrThrow({ where: { id: user.memberId } });
    expect(member).toMatchObject({ name: "Riley Runner", email: "riley.runner@example.com", organizationId: user.organizationId });
  });

  test("links to the profile a coach already created with the same email", async () => {
    const jason = await demoMember("jason@example.com");
    const response = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: "LEGION-DEMO", name: "Jason M", email: "jason@example.com", password: "a-long-password" });

    expect(response.status).toBe(201);
    expect(response.body.data.user.memberId).toBe(jason.id);
  });

  test("won't give one member profile a second login", async () => {
    const response = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: "LEGION-DEMO", name: "Alex", email: "athlete@example.com", password: "a-long-password" });

    expect(response.status).toBe(409);
  });

  test("rejects an unknown invite code", async () => {
    const response = await api()
      .post("/api/v1/auth/register")
      .send({ inviteCode: "NOPE-NOPE", name: "N", email: "n@example.com", password: "a-long-password" });

    expect(response.status).toBe(400);
    expect(response.body.data.error).toMatch(/invite code/);
  });
});

describe("logging in", () => {
  test.each(["coach@example.com", "athlete@example.com"])("the demo login %s works", async (email) => {
    const response = await api().post("/api/v1/auth/login").send({ email, password: "password" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(email);
  });

  test("the demo owner's password is not 'password'", async () => {
    const response = await api().post("/api/v1/auth/login").send({ email: "owner@example.com", password: "password" });
    expect(response.status).toBe(401);
  });

  test("gives the same answer for a wrong password and an unknown email", async () => {
    const wrongPassword = await api().post("/api/v1/auth/login").send({ email: "coach@example.com", password: "nope" });
    const unknownEmail = await api().post("/api/v1/auth/login").send({ email: "ghost@example.com", password: "nope" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  test("email is case-insensitive", async () => {
    const response = await api().post("/api/v1/auth/login").send({ email: "COACH@example.com", password: "password" });
    expect(response.status).toBe(200);
  });
});

describe("tokens", () => {
  test("a missing, malformed or forged token is a 401", async () => {
    const forged = require("jsonwebtoken").sign({ sub: "someone" }, "not-the-secret");

    for (const headers of [{}, { Authorization: "Token abc" }, bearer("not-a-jwt"), bearer(forged)]) {
      const response = await api().get("/api/v1/me").set(headers);
      expect(response.status).toBe(401);
      expect(response.body.status).toBe("FAILED");
    }
  });

  test("a role change applies to existing tokens straight away", async () => {
    const token = await login("coach@example.com");
    await prisma.user.update({ where: { email: "coach@example.com" }, data: { role: "athlete" } });

    const response = await api().post("/api/v1/workouts").set(bearer(token)).send({ name: "X", mode: "Y", exercises: ["Z"] });
    expect(response.status).toBe(403);
  });
});

describe("rate limiting", () => {
  afterEach(() => {
    process.env.DISABLE_RATE_LIMIT = "1";
  });

  test("blocks a burst of logins from one address", async () => {
    process.env.DISABLE_RATE_LIMIT = "0";
    const attempt = () =>
      api().post("/api/v1/auth/login").set("X-Real-IP", "203.0.113.9").send({ email: "coach@example.com", password: "nope" });

    for (let i = 0; i < 30; i += 1) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toEqual(expect.any(String));

    const otherAddress = await api().post("/api/v1/auth/login").set("X-Real-IP", "203.0.113.10").send({ email: "coach@example.com", password: "password" });
    expect(otherAddress.status).toBe(200);
  });
});
