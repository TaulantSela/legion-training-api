process.env.NODE_ENV = "test";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app } = require("../../src/app");

const membersEndpoint = "/api/v1/members";
const dbPath = path.join(__dirname, "../../src/database/db.json");

const readInitialDbState = () => fs.readFileSync(dbPath, "utf-8");
const writeDbState = (content) => fs.writeFileSync(dbPath, content, "utf-8");

const INITIAL_DB_STATE = readInitialDbState();

describe("Members API", () => {
  beforeEach(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  afterAll(() => {
    writeDbState(INITIAL_DB_STATE);
  });

  test("lists all members", async () => {
    const response = await request(app).get(membersEndpoint);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test("filters members by gender", async () => {
    const response = await request(app).get(`${membersEndpoint}?gender=female`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    const allFemale = response.body.data.every(
      (member) => (member.gender || "").toLowerCase() === "female"
    );
    expect(allFemale).toBe(true);
  });

  test("creates a new member", async () => {
    const payload = {
      name: "Jordan Example",
      gender: "male",
      dateOfBirth: "01/01/1995",
      email: "jordan@example.com",
      password: "secret",
    };

    const response = await request(app).post(membersEndpoint).send(payload);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("OK");
    expect(response.body.data).toMatchObject({
      name: payload.name,
      email: payload.email,
    });
    expect(response.body.data.id).toBeDefined();
  });

  test("rejects duplicate member email", async () => {
    const duplicateEmail = "jason@mail.com"; // already in seed data
    const payload = {
      name: "Duplicate Email",
      gender: "male",
      dateOfBirth: "02/02/1990",
      email: duplicateEmail,
    };

    const response = await request(app).post(membersEndpoint).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("FAILED");
    expect(response.body.data.error).toMatch(/already exists/i);
  });

  test("updates an existing member", async () => {
    const createResponse = await request(app).post(membersEndpoint).send({
      name: "Alex Update",
      gender: "female",
      dateOfBirth: "03/03/1993",
      email: "alex.update@example.com",
    });

    const memberId = createResponse.body.data.id;

    const response = await request(app)
      .patch(`${membersEndpoint}/${memberId}`)
      .send({ name: "Alex Updated" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.data.name).toBe("Alex Updated");
  });

  test("deletes a member and associated records", async () => {
    const createResponse = await request(app).post(membersEndpoint).send({
      name: "Taylor Delete",
      gender: "female",
      dateOfBirth: "04/04/1994",
      email: "taylor.delete@example.com",
    });

    const memberId = createResponse.body.data.id;

    const deleteResponse = await request(app).delete(
      `${membersEndpoint}/${memberId}`
    );

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app).get(
      `${membersEndpoint}/${memberId}`
    );
    expect(getResponse.status).toBe(404);
  });

  test("returns 404 for an unknown member", async () => {
    const response = await request(app).get(
      `${membersEndpoint}/non-existent-member`
    );

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("FAILED");
    expect(response.body.data.error).toMatch(/can't find member/i);
  });
});
