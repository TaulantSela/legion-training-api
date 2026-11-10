const { api, bearer, prisma, resetDatabase, login, demoWorkout, demoMember, openGym } = require("./helpers");

let rival;
let demoGym;
beforeEach(async () => {
  ({ rival, demoGym } = await resetDatabase());
});

describe("a coach only sees their own gym", () => {
  test("lists contain nothing from other gyms", async () => {
    const token = await login("coach@example.com");

    const workouts = await api().get("/api/v1/workouts?limit=100").set(bearer(token));
    const members = await api().get("/api/v1/members").set(bearer(token));
    const records = await api().get("/api/v1/records").set(bearer(token));

    expect(workouts.body.data.map((workout) => workout.name)).not.toContain("Rival WOD");
    expect(workouts.body.meta.total).toBe(7);
    expect(members.body.data.map((member) => member.email)).not.toContain("riley@example.com");
    expect(records.body.data.every((record) => record.workout.name !== "Rival WOD")).toBe(true);
  });

  test("another gym's ids are 404s for every read and write", async () => {
    const token = await login("coach@example.com");
    const { workout, member, record } = rival;
    const calls = [
      api().get(`/api/v1/workouts/${workout.id}`),
      api().get(`/api/v1/workouts/${workout.id}/records`),
      api().patch(`/api/v1/workouts/${workout.id}`).send({ name: "Hijacked" }),
      api().delete(`/api/v1/workouts/${workout.id}`),
      api().get(`/api/v1/members/${member.id}`),
      api().get(`/api/v1/members/${member.id}/records`),
      api().patch(`/api/v1/members/${member.id}`).send({ name: "Hijacked" }),
      api().delete(`/api/v1/members/${member.id}`),
      api().get(`/api/v1/records/${record.id}`),
      api().patch(`/api/v1/records/${record.id}`).send({ result: "0" }),
      api().delete(`/api/v1/records/${record.id}`),
      api().put(`/api/v1/me/records/${workout.id}`).send({ result: "1" }),
    ];

    for (const call of calls) {
      const response = await call.set(bearer(token));
      expect(response.status).toBe(call.method === "PUT" ? 409 : 404);
    }

    // Nothing in the rival gym changed
    expect(await prisma.workout.findUnique({ where: { id: workout.id } })).toMatchObject({ name: "Rival WOD" });
    expect(await prisma.member.findUnique({ where: { id: member.id } })).toMatchObject({ name: "Riley Rival" });
    expect(await prisma.record.findUnique({ where: { id: record.id } })).toMatchObject({ result: "5 rounds" });
  });

  test("an athlete can't log a result against another gym's workout", async () => {
    const token = await login("athlete@example.com");
    const response = await api().put(`/api/v1/me/records/${rival.workout.id}`).set(bearer(token)).send({ result: "1" });

    expect(response.status).toBe(404);
  });

  test("can't record a result that mixes gyms", async () => {
    const token = await login("coach@example.com");
    const tommyV = await demoWorkout("Tommy V");

    const otherMember = await api()
      .post("/api/v1/records")
      .set(bearer(token))
      .send({ memberId: rival.member.id, workoutId: tommyV.id, result: "1" });
    const otherWorkout = await api()
      .post("/api/v1/records")
      .set(bearer(token))
      .send({ memberId: (await demoMember("greg@example.com")).id, workoutId: rival.workout.id, result: "1" });

    expect(otherMember.status).toBe(400);
    expect(otherWorkout.status).toBe(400);
  });

  test("the database itself rejects a record that mixes gyms", async () => {
    const tommyV = await demoWorkout("Tommy V");

    await expect(
      prisma.record.create({
        data: { organizationId: demoGym.id, memberId: rival.member.id, workoutId: tommyV.id, result: "1" },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  test("a new gym starts empty", async () => {
    const { token } = await openGym();

    const workouts = await api().get("/api/v1/workouts").set(bearer(token));
    const members = await api().get("/api/v1/members").set(bearer(token));

    expect(workouts.body).toMatchObject({ data: [], meta: { total: 0 } });
    expect(members.body.data).toEqual([]);
  });

  test("two gyms can each have a workout with the same name", async () => {
    const { token } = await openGym();
    const response = await api()
      .post("/api/v1/workouts")
      .set(bearer(token))
      .send({ name: "Tommy V", mode: "For Time", exercises: ["21 thrusters"] });

    expect(response.status).toBe(201);
  });
});
