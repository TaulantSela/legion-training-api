process.env.NODE_ENV = "test";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app } = require("../../src/app");

const dbPath = path.join(__dirname, "../../src/database/db.json");
const readInitialDbState = () => fs.readFileSync(dbPath, "utf-8");
const writeDbState = (content) => fs.writeFileSync(dbPath, content, "utf-8");

const INITIAL_DB_STATE = readInitialDbState();

const workoutsEndpoint = "/api/v1/workouts";

describe("Authentication", () => {
  beforeEach(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  afterAll(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  test("registers a new athlete and returns a token", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "new.athlete@example.com",
      password: "password",
      role: "athlete",
      name: "New Athlete",
      organizationId: "org-1",
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("OK");
    expect(response.body.data.user.email).toBe("new.athlete@example.com");
    expect(response.body.data.token).toBeDefined();
  });

  test("logs in an existing coach and can access protected route", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "coach@example.com",
      password: "password",
    });

    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.data.token;
    expect(token).toBeDefined();

    const createResponse = await request(app)
      .post(workoutsEndpoint)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Coach Created WOD",
        mode: "AMRAP 10",
        equipment: ["barbell"],
        exercises: ["10 cleans", "10 push presses"],
        trainerTips: ["Keep transitions fast"],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.name).toBe("Coach Created WOD");
  });

  test("denies access to protected route without token", async () => {
    const response = await request(app).post(workoutsEndpoint).send({});

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("FAILED");
  });
});
