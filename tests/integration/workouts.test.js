process.env.NODE_ENV = "test";

const request = require("supertest");
const { app } = require("../../src/app");

const workoutsEndpoint = "/api/v1/workouts";

describe("Workouts API", () => {
  test("filters workouts by mode, case-insensitively", async () => {
    const response = await request(app).get(`${workoutsEndpoint}?mode=amrap`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    const allMatchMode = response.body.data.every((workout) =>
      workout.mode.toLowerCase().includes("amrap")
    );
    expect(allMatchMode).toBe(true);
  });

  test("filters workouts by required equipment list", async () => {
    const response = await request(app).get(
      `${workoutsEndpoint}?equipment=barbell,rope`
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    const allIncludeEquipment = response.body.data.every((workout) => {
      const normalized = (workout.equipment || []).map((item) =>
        item.toLowerCase()
      );
      return normalized.includes("barbell") && normalized.includes("rope");
    });
    expect(allIncludeEquipment).toBe(true);
  });

  test("enforces pagination arguments", async () => {
    const response = await request(app).get(
      `${workoutsEndpoint}?length=2&page=2&sort=createdAt`
    );

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  test("validates unsupported sort fields", async () => {
    const response = await request(app).get(
      `${workoutsEndpoint}?sort=invalidField`
    );

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("FAILED");
    expect(response.body.data.error).toMatch(/sort parameter/i);
  });

  test("returns 404 when workout is missing", async () => {
    const response = await request(app).get(
      `${workoutsEndpoint}/non-existent-workout`
    );

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("FAILED");
  });

  test("returns 404 when workout records are missing", async () => {
    const response = await request(app).get(
      `${workoutsEndpoint}/non-existent-workout/records`
    );

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("FAILED");
  });
});
