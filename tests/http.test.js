const { api, resetDatabase } = require("./helpers");
const { spec } = require("../src/openapi");

beforeAll(resetDatabase);

describe("errors are JSON", () => {
  test("unknown routes", async () => {
    const response = await api().get("/api/v1/nope");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({
      status: "FAILED",
      data: { error: "No route for GET /api/v1/nope. See /api/v1/docs for the endpoints." },
    });
  });

  test("malformed JSON, without a stack trace", async () => {
    const response = await api().post("/api/v1/auth/login").set("Content-Type", "application/json").send("{not json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ status: "FAILED", data: { error: "The request body isn't valid JSON" } });
  });

  test("bodies over 100kb", async () => {
    const response = await api()
      .post("/api/v1/auth/login")
      .send({ email: "a@example.com", password: "x".repeat(150_000) });
    expect(response.status).toBe(413);
  });

  test("no X-Powered-By header", async () => {
    const response = await api().get("/api/v1/healthz");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("pages", () => {
  test("health check pings the database", async () => {
    const response = await api().get("/api/v1/healthz");
    expect(response.body).toEqual({ status: "OK", data: { service: "legion", healthy: true, database: "ok" } });
  });

  test("the landing page uses the host the visitor reached, escaped", async () => {
    const response = await api().get("/").set("Host", "legion.example.com").set("X-Forwarded-Proto", "https");
    const injected = await api().get("/").set("Host", '"><script>x</script>');

    expect(response.status).toBe(200);
    expect(response.text).toContain("curl -X POST https://legion.example.com/api/v1/auth/login");
    expect(injected.text).not.toContain("<script>x</script>");
  });

  test("the docs page and spec", async () => {
    const page = await api().get("/api/v1/docs");
    const json = await api().get("/api/v1/docs.json");

    expect(page.text).toContain("swagger-ui-dist@5.32.0");
    expect(json.body.openapi).toBe("3.1.0");
  });
});

describe("the OpenAPI spec matches the routes", () => {
  const routeMissing = (response) => response.status === 404 && /^No route for/.test(response.body?.data?.error ?? "");
  const operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.keys(methods).map((method) => [method.toUpperCase(), path]),
  );

  test.each(operations)("%s %s exists", async (method, path) => {
    const url = path.replace("{slug}", "legion-demo").replace(/\{[^}]+\}/g, "some-id");
    const response = await api()[method.toLowerCase()](url).send({});
    expect(routeMissing(response)).toBe(false);
  });

  test("every $ref points at a schema that exists", () => {
    const refs = [...JSON.stringify(spec).matchAll(/"#\/components\/schemas\/([^"]+)"/g)].map((match) => match[1]);
    const missing = refs.filter((name) => !spec.components.schemas[name]);
    expect(missing).toEqual([]);
  });
});
