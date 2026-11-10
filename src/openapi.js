// OpenAPI 3.1 description served at /api/v1/docs.json. tests/docs.test.js checks that every
// operation here is backed by a real route.

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ "application/json": { schema } });
const okBody = (data, extra = {}) => ({
  type: "object",
  properties: { status: { type: "string", const: "OK" }, data, ...extra },
});

const responses = {
  400: { description: "Invalid request", content: json(ref("Error")) },
  401: { description: "Missing, invalid or expired token", content: json(ref("Error")) },
  403: { description: "Your role can't do this", content: json(ref("Error")) },
  404: { description: "Not found in your gym", content: json(ref("Error")) },
  409: { description: "Conflicts with existing data", content: json(ref("Error")) },
  429: { description: "Too many attempts", content: json(ref("Error")) },
};
const errors = (...codes) => Object.fromEntries(codes.map((code) => [code, responses[code]]));
const success = (status, description, data, extra) => ({
  [status]: { description, content: json(okBody(data, extra)) },
});
const noContent = { 204: { description: "Deleted" } };
const body = (schema) => ({ required: true, content: json(schema) });
const path = (name, description) => ({ name, in: "path", required: true, description, schema: { type: "string" } });
const query = (name, description, schema = { type: "string" }) => ({ name, in: "query", description, schema });
const auth = [{ bearerAuth: [] }];
const listOf = (name) => ({ type: "array", items: ref(name) });

const workoutFilters = [
  query("mode", "Part of the mode, any case, e.g. amrap"),
  query("equipment", "One piece of equipment, e.g. barbell"),
];
const pageMeta = { meta: ref("PageMeta") };
const listWorkoutParams = [
  ...workoutFilters,
  query("sort", "Sort field, prefix with - for descending", {
    type: "string",
    enum: ["name", "-name", "mode", "-mode", "createdAt", "-createdAt", "updatedAt", "-updatedAt"],
  }),
  query("page", "Page number", { type: "integer", minimum: 1, default: 1 }),
  query("limit", "Items per page", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
];

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Legion Training API",
    version: "2.0.0",
    description: [
      "A multi-tenant API for gyms. Each gym is a tenant: its workouts, members and records are invisible to every other gym.",
      "",
      "**Try it:** call `POST /api/v1/auth/login` with `coach@example.com` / `password`, copy the token, press **Authorize** and paste it.",
      "Log in as `athlete@example.com` / `password` to see what athletes can do, or open your own gym with `POST /api/v1/auth/register-gym` to become its admin.",
      "",
      "The demo gym is rebuilt every night, and gyms you open are deleted after 7 days.",
    ].join("\n"),
  },
  tags: [
    { name: "Auth", description: "Open a gym, join one, log in" },
    { name: "Me", description: "The signed-in user, and athletes logging their own results" },
    { name: "Gym", description: "Your gym's settings and people (admin)" },
    { name: "Workouts", description: "Your gym's workouts. Everyone reads, coaches and admins write." },
    { name: "Members", description: "Athlete profiles (coaches and admins)" },
    { name: "Records", description: "Results per member and workout" },
    { name: "Public", description: "No token needed" },
  ],
  paths: {
    "/api/v1/auth/register-gym": {
      post: {
        tags: ["Auth"],
        summary: "Open a new gym and become its admin",
        requestBody: body(ref("RegisterGymInput")),
        responses: {
          ...success(201, "Gym and admin account created", ref("SignUpResult")),
          ...errors(400, 409, 429),
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Join a gym as an athlete with its invite code",
        description: "Try `LEGION-DEMO` to join the demo gym. If a coach already added you as a member with the same email, your login is linked to that profile.",
        requestBody: body(ref("RegisterAthleteInput")),
        responses: {
          ...success(201, "Athlete account created", ref("SignUpResult")),
          ...errors(400, 409, 429),
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and get a token",
        requestBody: body(ref("LoginInput")),
        responses: { ...success(200, "Logged in", ref("AuthResult")), ...errors(400, 401, 429) },
      },
    },

    "/api/v1/me": {
      get: {
        tags: ["Me"],
        summary: "The signed-in user, their gym and member profile",
        security: auth,
        responses: { ...success(200, "You", ref("Me")), ...errors(401) },
      },
    },
    "/api/v1/me/records": {
      get: {
        tags: ["Me"],
        summary: "Your own results",
        security: auth,
        responses: { ...success(200, "Your records", listOf("Record")), ...errors(401, 409) },
      },
    },
    "/api/v1/me/records/{workoutId}": {
      put: {
        tags: ["Me"],
        summary: "Log your result for a workout",
        description: "Logging the same workout again replaces your result. Returns 201 the first time, 200 after.",
        security: auth,
        parameters: [path("workoutId", "A workout in your gym")],
        requestBody: body(ref("ResultInput")),
        responses: {
          ...success(201, "Result logged", ref("Record")),
          ...success(200, "Result replaced", ref("Record")),
          ...errors(400, 401, 404, 409),
        },
      },
    },

    "/api/v1/gym": {
      get: {
        tags: ["Gym"],
        summary: "Your gym",
        description: "Coaches and admins also see the invite code.",
        security: auth,
        responses: { ...success(200, "Your gym", ref("Gym")), ...errors(401) },
      },
      patch: {
        tags: ["Gym"],
        summary: "Rename your gym or publish its catalogue",
        security: auth,
        requestBody: body(ref("GymUpdate")),
        responses: { ...success(200, "Updated", ref("Gym")), ...errors(400, 401, 403) },
      },
    },
    "/api/v1/gym/invite-code": {
      post: {
        tags: ["Gym"],
        summary: "Replace the invite code",
        description: "The old code stops working at once.",
        security: auth,
        responses: { ...success(200, "New code issued", ref("Gym")), ...errors(401, 403) },
      },
    },
    "/api/v1/users": {
      get: {
        tags: ["Gym"],
        summary: "Everyone with a login at your gym",
        security: auth,
        responses: { ...success(200, "Users", listOf("User")), ...errors(401, 403) },
      },
    },
    "/api/v1/users/{userId}": {
      patch: {
        tags: ["Gym"],
        summary: "Change someone's role",
        security: auth,
        parameters: [path("userId", "A user in your gym")],
        requestBody: body(ref("RoleInput")),
        responses: { ...success(200, "Role changed", ref("User")), ...errors(400, 401, 403, 404) },
      },
    },

    "/api/v1/workouts": {
      get: {
        tags: ["Workouts"],
        summary: "List workouts",
        security: auth,
        parameters: listWorkoutParams,
        responses: { ...success(200, "A page of workouts", listOf("Workout"), pageMeta), ...errors(400, 401) },
      },
      post: {
        tags: ["Workouts"],
        summary: "Create a workout",
        security: auth,
        requestBody: body(ref("WorkoutInput")),
        responses: { ...success(201, "Created", ref("Workout")), ...errors(400, 401, 403, 409) },
      },
    },
    "/api/v1/workouts/random": {
      get: {
        tags: ["Workouts"],
        summary: "A random workout",
        security: auth,
        parameters: workoutFilters,
        responses: { ...success(200, "A workout", ref("Workout")), ...errors(401, 404) },
      },
    },
    "/api/v1/workouts/{workoutId}": {
      get: {
        tags: ["Workouts"],
        summary: "One workout",
        security: auth,
        parameters: [path("workoutId", "Workout id")],
        responses: { ...success(200, "The workout", ref("Workout")), ...errors(401, 404) },
      },
      patch: {
        tags: ["Workouts"],
        summary: "Update a workout",
        security: auth,
        parameters: [path("workoutId", "Workout id")],
        requestBody: body(ref("WorkoutUpdate")),
        responses: { ...success(200, "Updated", ref("Workout")), ...errors(400, 401, 403, 404, 409) },
      },
      delete: {
        tags: ["Workouts"],
        summary: "Delete a workout and its records",
        security: auth,
        parameters: [path("workoutId", "Workout id")],
        responses: { ...noContent, ...errors(401, 403, 404) },
      },
    },
    "/api/v1/workouts/{workoutId}/records": {
      get: {
        tags: ["Workouts"],
        summary: "Everyone's results for a workout",
        security: auth,
        parameters: [path("workoutId", "Workout id")],
        responses: { ...success(200, "Records", listOf("Record")), ...errors(401, 404) },
      },
    },

    "/api/v1/members": {
      get: {
        tags: ["Members"],
        summary: "List members",
        security: auth,
        parameters: [query("email", "Exact email"), query("gender", "Gender, any case")],
        responses: { ...success(200, "Members", listOf("Member")), ...errors(400, 401, 403) },
      },
      post: {
        tags: ["Members"],
        summary: "Add a member",
        security: auth,
        requestBody: body(ref("MemberInput")),
        responses: { ...success(201, "Created", ref("Member")), ...errors(400, 401, 403, 409) },
      },
    },
    "/api/v1/members/{memberId}": {
      get: {
        tags: ["Members"],
        summary: "One member",
        security: auth,
        parameters: [path("memberId", "Member id")],
        responses: { ...success(200, "The member", ref("Member")), ...errors(401, 403, 404) },
      },
      patch: {
        tags: ["Members"],
        summary: "Update a member",
        security: auth,
        parameters: [path("memberId", "Member id")],
        requestBody: body(ref("MemberUpdate")),
        responses: { ...success(200, "Updated", ref("Member")), ...errors(400, 401, 403, 404, 409) },
      },
      delete: {
        tags: ["Members"],
        summary: "Delete a member and their records",
        security: auth,
        parameters: [path("memberId", "Member id")],
        responses: { ...noContent, ...errors(401, 403, 404) },
      },
    },
    "/api/v1/members/{memberId}/records": {
      get: {
        tags: ["Members"],
        summary: "A member's results",
        security: auth,
        parameters: [path("memberId", "Member id")],
        responses: { ...success(200, "Records", listOf("Record")), ...errors(401, 403, 404) },
      },
    },

    "/api/v1/records": {
      get: {
        tags: ["Records"],
        summary: "List records",
        security: auth,
        parameters: [query("memberId", "Only this member"), query("workoutId", "Only this workout")],
        responses: { ...success(200, "Records", listOf("Record")), ...errors(400, 401) },
      },
      post: {
        tags: ["Records"],
        summary: "Record a member's result",
        security: auth,
        requestBody: body(ref("RecordInput")),
        responses: { ...success(201, "Created", ref("Record")), ...errors(400, 401, 403, 409) },
      },
    },
    "/api/v1/records/{recordId}": {
      get: {
        tags: ["Records"],
        summary: "One record",
        security: auth,
        parameters: [path("recordId", "Record id")],
        responses: { ...success(200, "The record", ref("Record")), ...errors(401, 404) },
      },
      patch: {
        tags: ["Records"],
        summary: "Change a result",
        security: auth,
        parameters: [path("recordId", "Record id")],
        requestBody: body(ref("ResultInput")),
        responses: { ...success(200, "Updated", ref("Record")), ...errors(400, 401, 403, 404) },
      },
      delete: {
        tags: ["Records"],
        summary: "Delete a record",
        security: auth,
        parameters: [path("recordId", "Record id")],
        responses: { ...noContent, ...errors(401, 403, 404) },
      },
    },

    "/api/v1/healthz": {
      get: {
        tags: ["Public"],
        summary: "Health check, including the database",
        responses: success(200, "Healthy", {
          type: "object",
          properties: { service: { type: "string" }, healthy: { type: "boolean" }, database: { type: "string" } },
        }),
      },
    },
    "/api/v1/gyms/{slug}": {
      get: {
        tags: ["Public"],
        summary: "A gym with a public catalogue",
        parameters: [path("slug", "Try legion-demo")],
        responses: { ...success(200, "The gym", ref("PublicGym")), ...errors(404) },
      },
    },
    "/api/v1/gyms/{slug}/workouts": {
      get: {
        tags: ["Public"],
        summary: "A gym's public workout catalogue",
        parameters: [path("slug", "Try legion-demo"), ...listWorkoutParams],
        responses: { ...success(200, "A page of workouts", listOf("Workout"), pageMeta), ...errors(400, 404) },
      },
    },
    "/api/v1/gyms/{slug}/workouts/random": {
      get: {
        tags: ["Public"],
        summary: "A random workout from a public catalogue",
        parameters: [path("slug", "Try legion-demo"), ...workoutFilters],
        responses: { ...success(200, "A workout", ref("Workout")), ...errors(404) },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Error: {
        type: "object",
        properties: {
          status: { type: "string", const: "FAILED" },
          data: {
            type: "object",
            properties: {
              error: { type: "string", example: "No workout with id 'abc' in your gym" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: { field: { type: ["string", "null"] }, message: { type: "string" } },
                },
              },
            },
          },
        },
      },
      PageMeta: {
        type: "object",
        properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" } },
      },
      RegisterGymInput: {
        type: "object",
        additionalProperties: false,
        required: ["gymName", "name", "email", "password"],
        properties: {
          gymName: { type: "string", example: "Iron Temple" },
          name: { type: "string", example: "Sam Owner" },
          email: { type: "string", format: "email", example: "sam@example.com" },
          password: { type: "string", minLength: 8, example: "a-long-password" },
        },
      },
      RegisterAthleteInput: {
        type: "object",
        additionalProperties: false,
        required: ["inviteCode", "name", "email", "password"],
        properties: {
          inviteCode: { type: "string", example: "LEGION-DEMO" },
          name: { type: "string", example: "Riley Runner" },
          email: { type: "string", format: "email", example: "riley@example.com" },
          password: { type: "string", minLength: 8, example: "a-long-password" },
        },
      },
      LoginInput: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "coach@example.com" },
          password: { type: "string", example: "password" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: { type: "string", enum: ["admin", "coach", "athlete"] },
          organizationId: { type: "string" },
          memberId: { type: ["string", "null"] },
        },
      },
      AuthResult: { type: "object", properties: { token: { type: "string" }, user: ref("User") } },
      SignUpResult: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: ref("User"),
          gym: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              slug: { type: "string" },
              inviteCode: { type: "string", description: "Only when you open a gym" },
            },
          },
        },
      },
      Me: {
        allOf: [
          ref("User"),
          {
            type: "object",
            properties: {
              gym: ref("PublicGym"),
              member: {
                type: ["object", "null"],
                properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string" } },
              },
            },
          },
        ],
      },
      Gym: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          publicCatalog: { type: "boolean" },
          inviteCode: { type: "string", description: "Coaches and admins only" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      PublicGym: {
        type: "object",
        properties: { name: { type: "string" }, slug: { type: "string" } },
      },
      GymUpdate: {
        type: "object",
        additionalProperties: false,
        properties: { name: { type: "string" }, publicCatalog: { type: "boolean" } },
      },
      RoleInput: {
        type: "object",
        additionalProperties: false,
        required: ["role"],
        properties: { role: { type: "string", enum: ["admin", "coach", "athlete"] } },
      },
      Workout: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Tommy V" },
          mode: { type: "string", example: "For Time" },
          equipment: { type: "array", items: { type: "string" }, example: ["barbell", "rope"] },
          exercises: { type: "array", items: { type: "string" }, example: ["21 thrusters", "12 rope climbs, 15 ft"] },
          trainerTips: { type: "array", items: { type: "string" }, example: ["Split the 21 thrusters as needed"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WorkoutInput: {
        type: "object",
        additionalProperties: false,
        required: ["name", "mode", "exercises"],
        properties: {
          name: { type: "string", example: "Legion Builder" },
          mode: { type: "string", example: "AMRAP 12" },
          equipment: { type: "array", items: { type: "string" }, example: ["barbell"] },
          exercises: { type: "array", items: { type: "string" }, example: ["12 thrusters", "12 pull-ups"] },
          trainerTips: { type: "array", items: { type: "string" }, example: ["Stay unbroken"] },
        },
      },
      WorkoutUpdate: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          mode: { type: "string" },
          equipment: { type: "array", items: { type: "string" } },
          exercises: { type: "array", items: { type: "string" } },
          trainerTips: { type: "array", items: { type: "string" } },
        },
      },
      Member: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          gender: { type: ["string", "null"] },
          dateOfBirth: { type: ["string", "null"], format: "date" },
          hasLogin: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MemberInput: {
        type: "object",
        additionalProperties: false,
        required: ["name", "email"],
        properties: {
          name: { type: "string", example: "Jordan Lifter" },
          email: { type: "string", format: "email", example: "jordan@example.com" },
          gender: { type: "string", example: "female" },
          dateOfBirth: { type: "string", format: "date", example: "1994-05-30" },
        },
      },
      MemberUpdate: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          gender: { type: ["string", "null"] },
          dateOfBirth: { type: ["string", "null"], format: "date" },
        },
      },
      Record: {
        type: "object",
        properties: {
          id: { type: "string" },
          result: { type: "string", example: "7:23" },
          member: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
          workout: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RecordInput: {
        type: "object",
        additionalProperties: false,
        required: ["memberId", "workoutId", "result"],
        properties: {
          memberId: { type: "string" },
          workoutId: { type: "string" },
          result: { type: "string", example: "358 reps" },
        },
      },
      ResultInput: {
        type: "object",
        additionalProperties: false,
        required: ["result"],
        properties: { result: { type: "string", example: "8:15" } },
      },
    },
  },
};

module.exports = { spec };
