process.env.NODE_ENV = "test";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app } = require("../../src/app");

const recordsEndpoint = "/api/v1/records";
const workoutRecordsEndpoint = (workoutId) => `/api/v1/workouts/${workoutId}/records`;
const dbPath = path.join(__dirname, "../../src/database/db.json");

const readInitialDbState = () => fs.readFileSync(dbPath, "utf-8");
const writeDbState = (content) => fs.writeFileSync(dbPath, content, "utf-8");

const INITIAL_DB_STATE = readInitialDbState();

const seededWorkoutId = "4a3d9aaa-608c-49a7-a004-66305ad4ab50";
const seededMemberId = "11817fb1-03a1-4b4a-8d27-854ac893cf41";

describe("Records API", () => {
  beforeEach(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  afterAll(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  test("lists all records with optional filters", async () => {
    const response = await request(app).get(
      `${recordsEndpoint}?workoutId=${seededWorkoutId}&memberId=${seededMemberId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    const allMatch = response.body.data.every(
      (record) => record.workout === seededWorkoutId && record.memberId === seededMemberId
    );
    expect(allMatch).toBe(true);
  });

  test("retrieves records for a workout via workout route", async () => {
    const response = await request(app).get(workoutRecordsEndpoint(seededWorkoutId));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test("creates a new record", async () => {
    const payload = {
      workout: "61dbae02-c147-4e28-863c-db7bd402b2d6",
      memberId: "12a410bc-849f-4e7e-bfc8-4ef283ee4b19",
      record: "12:45 minutes",
    };

    const response = await request(app).post(recordsEndpoint).send(payload);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("OK");
    expect(response.body.data).toMatchObject(payload);
    expect(response.body.data.id).toBeDefined();
  });

  test("rejects duplicate member/workout record", async () => {
    const payload = {
      workout: seededWorkoutId,
      memberId: seededMemberId,
      record: "999 reps",
    };

    const response = await request(app).post(recordsEndpoint).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("FAILED");
    expect(response.body.data.error).toMatch(/already has a record/i);
  });

  test("updates an existing record", async () => {
    const createResponse = await request(app).post(recordsEndpoint).send({
      workout: "61dbae02-c147-4e28-863c-db7bd402b2d6",
      memberId: "2b9130d4-47a7-4085-800e-0144f6a46059",
      record: "150 reps",
    });

    const recordId = createResponse.body.data.id;

    const response = await request(app)
      .patch(`${recordsEndpoint}/${recordId}`)
      .send({ record: "155 reps" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.data.record).toBe("155 reps");
  });

  test("deletes a record", async () => {
    const createResponse = await request(app).post(recordsEndpoint).send({
      workout: "61dbae02-c147-4e28-863c-db7bd402b2d6",
      memberId: "6a89217b-7c28-4219-bd7f-af119c314159",
      record: "20 rounds",
    });

    const recordId = createResponse.body.data.id;

    const deleteResponse = await request(app).delete(`${recordsEndpoint}/${recordId}`);
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app).get(`${recordsEndpoint}/${recordId}`);
    expect(getResponse.status).toBe(404);
  });

  test("returns 404 for unknown record", async () => {
    const response = await request(app).get(`${recordsEndpoint}/non-existent-record`);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("FAILED");
  });
});
