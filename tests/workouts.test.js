const { api, bearer, resetDatabase, login, demoWorkout } = require("./helpers");

let coach;
let athlete;
beforeEach(async () => {
  await resetDatabase();
  [coach, athlete] = await Promise.all([login("coach@example.com"), login("athlete@example.com")]);
});

const newWorkout = { name: "Legion Builder", mode: "AMRAP 12", equipment: ["Barbell"], exercises: ["12 thrusters", "12 pull-ups"] };

describe("reading workouts", () => {
  test("needs a token", async () => {
    expect((await api().get("/api/v1/workouts")).status).toBe(401);
  });

  test("pages and counts", async () => {
    const response = await api().get("/api/v1/workouts?limit=3&page=2&sort=name").set(bearer(athlete));

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ page: 2, limit: 3, total: 7 });
    expect(response.body.data.map((workout) => workout.name)).toEqual(["Dumbbell Rower", "Heavy DT", "Jumping (Not) Made Easy"]);
  });

  test("filters by mode and equipment", async () => {
    const response = await api().get("/api/v1/workouts?mode=amrap&equipment=BARBELL").set(bearer(athlete));

    expect(response.body.data.map((workout) => workout.name).sort()).toEqual(["Core Buster", "Dead Push-Ups"]);
  });

  test("sorts descending with a leading minus", async () => {
    const response = await api().get("/api/v1/workouts?sort=-name&limit=2").set(bearer(athlete));
    expect(response.body.data.map((workout) => workout.name)).toEqual(["Tommy V", "Jumping (Not) Made Easy"]);
  });

  test("rejects an unknown sort or a bad page", async () => {
    expect((await api().get("/api/v1/workouts?sort=password").set(bearer(athlete))).status).toBe(400);
    expect((await api().get("/api/v1/workouts?page=0").set(bearer(athlete))).status).toBe(400);
    expect((await api().get("/api/v1/workouts?limit=1000").set(bearer(athlete))).status).toBe(400);
  });

  test("a random workout respects the filters", async () => {
    for (let i = 0; i < 5; i += 1) {
      const response = await api().get("/api/v1/workouts/random?equipment=rope").set(bearer(athlete));
      expect(["Tommy V", "Heavy DT"]).toContain(response.body.data.name);
    }
  });

  test("a random workout is a 404 when nothing matches", async () => {
    const response = await api().get("/api/v1/workouts/random?equipment=sled").set(bearer(athlete));
    expect(response.status).toBe(404);
  });

  test("one workout, and its records for the leaderboard", async () => {
    const coreBuster = await demoWorkout("Core Buster");

    const workout = await api().get(`/api/v1/workouts/${coreBuster.id}`).set(bearer(athlete));
    const records = await api().get(`/api/v1/workouts/${coreBuster.id}/records`).set(bearer(athlete));

    expect(workout.body.data.name).toBe("Core Buster");
    expect(records.body.data.map((record) => [record.member.name, record.result]).sort()).toEqual([
      ["Catrin Stevenson", "358 reps"],
      ["Jason Miller", "301 reps"],
    ]);
  });

  test("an unknown id is a 404", async () => {
    expect((await api().get("/api/v1/workouts/nope").set(bearer(athlete))).status).toBe(404);
    expect((await api().get("/api/v1/workouts/nope/records").set(bearer(athlete))).status).toBe(404);
  });
});

describe("changing workouts", () => {
  test("a coach creates, updates and deletes one", async () => {
    const created = await api().post("/api/v1/workouts").set(bearer(coach)).send(newWorkout);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: "Legion Builder", equipment: ["barbell"], trainerTips: [] });

    const { id } = created.body.data;
    const updated = await api().patch(`/api/v1/workouts/${id}`).set(bearer(coach)).send({ mode: "AMRAP 15" });
    expect(updated.body.data).toMatchObject({ name: "Legion Builder", mode: "AMRAP 15" });

    expect((await api().delete(`/api/v1/workouts/${id}`).set(bearer(coach))).status).toBe(204);
    expect((await api().get(`/api/v1/workouts/${id}`).set(bearer(coach))).status).toBe(404);
  });

  test("the list shows a change straight away", async () => {
    await api().get("/api/v1/workouts").set(bearer(coach));
    await api().post("/api/v1/workouts").set(bearer(coach)).send(newWorkout);

    const response = await api().get("/api/v1/workouts").set(bearer(coach));
    expect(response.body.meta.total).toBe(8);
  });

  test("athletes can't change workouts", async () => {
    const tommyV = await demoWorkout("Tommy V");

    expect((await api().post("/api/v1/workouts").set(bearer(athlete)).send(newWorkout)).status).toBe(403);
    expect((await api().patch(`/api/v1/workouts/${tommyV.id}`).set(bearer(athlete)).send({ mode: "x" })).status).toBe(403);
    expect((await api().delete(`/api/v1/workouts/${tommyV.id}`).set(bearer(athlete))).status).toBe(403);
  });

  test("names are unique within a gym", async () => {
    const response = await api().post("/api/v1/workouts").set(bearer(coach)).send({ ...newWorkout, name: "Tommy V" });
    expect(response.status).toBe(409);

    const tommyV = await demoWorkout("Tommy V");
    const rename = await api().patch(`/api/v1/workouts/${tommyV.id}`).set(bearer(coach)).send({ name: "Heavy DT" });
    expect(rename.status).toBe(409);
  });

  test("validates the body", async () => {
    const empty = await api().post("/api/v1/workouts").set(bearer(coach)).send({ name: "X", mode: "Y", exercises: [] });
    const unknown = await api().post("/api/v1/workouts").set(bearer(coach)).send({ ...newWorkout, id: "mine" });
    const nothing = await api().patch(`/api/v1/workouts/${(await demoWorkout("Tommy V")).id}`).set(bearer(coach)).send({});

    expect(empty.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(nothing.status).toBe(400);
  });

  test("deleting a workout deletes its records", async () => {
    const coreBuster = await demoWorkout("Core Buster");
    await api().delete(`/api/v1/workouts/${coreBuster.id}`).set(bearer(coach));

    const records = await api().get("/api/v1/records").set(bearer(coach));
    expect(records.body.data.some((record) => record.workout.name === "Core Buster")).toBe(false);
  });
});
