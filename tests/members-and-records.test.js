const { api, bearer, prisma, resetDatabase, login, demoWorkout, demoMember } = require("./helpers");

let coach;
let athlete;
beforeEach(async () => {
  await resetDatabase();
  [coach, athlete] = await Promise.all([login("coach@example.com"), login("athlete@example.com")]);
});

describe("members", () => {
  test("never include a password", async () => {
    const response = await api().get("/api/v1/members").set(bearer(coach));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    for (const member of response.body.data) {
      expect(Object.keys(member).sort()).toEqual(
        ["createdAt", "dateOfBirth", "email", "gender", "hasLogin", "id", "name", "updatedAt"].sort(),
      );
    }
    expect(response.body.data.find((member) => member.email === "athlete@example.com").hasLogin).toBe(true);
  });

  test("are only visible to staff", async () => {
    expect((await api().get("/api/v1/members")).status).toBe(401);
    expect((await api().get("/api/v1/members").set(bearer(athlete))).status).toBe(403);
  });

  test("filter by email or gender", async () => {
    const byEmail = await api().get("/api/v1/members?email=GREG@example.com").set(bearer(coach));
    const byGender = await api().get("/api/v1/members?gender=Female").set(bearer(coach));

    expect(byEmail.body.data.map((member) => member.name)).toEqual(["Greg Bronson"]);
    expect(byGender.body.data.map((member) => member.name)).toEqual(["Catrin Stevenson", "Tiffany Brookston"]);
  });

  test("a coach creates, updates and deletes one", async () => {
    const created = await api()
      .post("/api/v1/members")
      .set(bearer(coach))
      .send({ name: "Jordan Lifter", email: "jordan@example.com", dateOfBirth: "1994-05-30" });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ dateOfBirth: "1994-05-30", gender: null, hasLogin: false });

    const { id } = created.body.data;
    const updated = await api().patch(`/api/v1/members/${id}`).set(bearer(coach)).send({ gender: "female", dateOfBirth: null });
    expect(updated.body.data).toMatchObject({ gender: "female", dateOfBirth: null });

    expect((await api().delete(`/api/v1/members/${id}`).set(bearer(coach))).status).toBe(204);
    expect((await api().get(`/api/v1/members/${id}`).set(bearer(coach))).status).toBe(404);
  });

  test("rejects a password field and impossible dates", async () => {
    const withPassword = await api()
      .post("/api/v1/members")
      .set(bearer(coach))
      .send({ name: "P", email: "p@example.com", password: "secret" });
    const badDate = await api()
      .post("/api/v1/members")
      .set(bearer(coach))
      .send({ name: "D", email: "d@example.com", dateOfBirth: "2001-02-30" });

    expect(withPassword.status).toBe(400);
    expect(badDate.status).toBe(400);
  });

  test("emails are unique within a gym", async () => {
    const response = await api().post("/api/v1/members").set(bearer(coach)).send({ name: "G", email: "greg@example.com" });
    expect(response.status).toBe(409);
  });

  test("deleting a member deletes their records and unlinks their login", async () => {
    const alex = await demoMember("athlete@example.com");
    await api().delete(`/api/v1/members/${alex.id}`).set(bearer(coach));

    expect(await prisma.record.count({ where: { memberId: alex.id } })).toBe(0);
    expect(await prisma.user.findUnique({ where: { email: "athlete@example.com" } })).toMatchObject({ memberId: null });
  });

  test("a member's records", async () => {
    const catrin = await demoMember("catrin@example.com");
    const response = await api().get(`/api/v1/members/${catrin.id}/records`).set(bearer(coach));

    expect(response.body.data).toHaveLength(3);
  });
});

describe("records", () => {
  test("everyone in the gym can read them", async () => {
    const response = await api().get("/api/v1/records").set(bearer(athlete));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(7);
    expect(response.body.data[0]).toEqual({
      id: expect.any(String),
      result: expect.any(String),
      member: { id: expect.any(String), name: expect.any(String) },
      workout: { id: expect.any(String), name: expect.any(String) },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  test("filter by member and workout", async () => {
    const catrin = await demoMember("catrin@example.com");
    const heavyDT = await demoWorkout("Heavy DT");

    const response = await api().get(`/api/v1/records?memberId=${catrin.id}&workoutId=${heavyDT.id}`).set(bearer(coach));
    expect(response.body.data.map((record) => record.result)).toEqual(["7:23"]);
  });

  test("a coach creates, updates and deletes one", async () => {
    const greg = await demoMember("greg@example.com");
    const tommyV = await demoWorkout("Tommy V");

    const created = await api().post("/api/v1/records").set(bearer(coach)).send({ memberId: greg.id, workoutId: tommyV.id, result: "10:02" });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ result: "10:02", member: { name: "Greg Bronson" }, workout: { name: "Tommy V" } });

    const { id } = created.body.data;
    const updated = await api().patch(`/api/v1/records/${id}`).set(bearer(coach)).send({ result: "9:50" });
    expect(updated.body.data.result).toBe("9:50");

    expect((await api().delete(`/api/v1/records/${id}`).set(bearer(coach))).status).toBe(204);
    expect((await api().get(`/api/v1/records/${id}`).set(bearer(coach))).status).toBe(404);
  });

  test("one record per member and workout", async () => {
    const catrin = await demoMember("catrin@example.com");
    const heavyDT = await demoWorkout("Heavy DT");

    const response = await api().post("/api/v1/records").set(bearer(coach)).send({ memberId: catrin.id, workoutId: heavyDT.id, result: "7:00" });
    expect(response.status).toBe(409);
  });

  test("athletes can't change other people's records", async () => {
    const greg = await demoMember("greg@example.com");
    const tommyV = await demoWorkout("Tommy V");
    const [record] = (await api().get("/api/v1/records").set(bearer(athlete))).body.data;

    expect((await api().post("/api/v1/records").set(bearer(athlete)).send({ memberId: greg.id, workoutId: tommyV.id, result: "1" })).status).toBe(403);
    expect((await api().patch(`/api/v1/records/${record.id}`).set(bearer(athlete)).send({ result: "1" })).status).toBe(403);
    expect((await api().delete(`/api/v1/records/${record.id}`).set(bearer(athlete))).status).toBe(403);
  });
});
