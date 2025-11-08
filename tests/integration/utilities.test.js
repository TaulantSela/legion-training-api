process.env.NODE_ENV = "test";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app } = require("../../src/app");

const dbPath = path.join(__dirname, "../../src/database/db.json");
const readInitialDbState = () => fs.readFileSync(dbPath, "utf-8");
const writeDbState = (content) => fs.writeFileSync(dbPath, content, "utf-8");

const INITIAL_DB_STATE = readInitialDbState();

describe("Utility Endpoints", () => {
  beforeEach(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  afterAll(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  test("health endpoint reports service healthy", async () => {
    const response = await request(app).get("/api/v1/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "OK",
      data: { service: "legion", healthy: true },
    });
  });

  test("random workout endpoint returns a workout", async () => {
    const response = await request(app).get("/api/v1/workouts/random");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("name");
  });

  test("random workout honors filters", async () => {
    const response = await request(app).get(
      "/api/v1/workouts/random?mode=AMRAP&equipment=barbell"
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.data.mode.toLowerCase()).toContain("amrap");
    const equipment = (response.body.data.equipment || []).map((item) =>
      item.toLowerCase()
    );
    expect(equipment).toContain("barbell");
  });

  test("random workout returns 404 when filters exclude all workouts", async () => {
    const response = await request(app).get(
      "/api/v1/workouts/random?equipment=nonexistent-equipment"
    );

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("FAILED");
  });
});
