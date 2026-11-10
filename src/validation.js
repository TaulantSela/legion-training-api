const { z } = require("zod");
const { badRequest } = require("./errors");

const text = (max) => z.string().trim().min(1).max(max);
const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(8, "Password must be at least 8 characters").max(128);
const role = z.enum(["admin", "coach", "athlete"]);
const list = (max) => z.array(text(200)).max(max);
const equipment = z.array(text(60).toLowerCase()).max(20);

// Strict objects reject unknown keys, so a client sending `role` on sign-up gets a clear 400
const schemas = {
  registerGym: z.strictObject({
    gymName: text(80),
    name: text(80),
    email,
    password,
  }),
  registerAthlete: z.strictObject({
    inviteCode: text(20).toUpperCase(),
    name: text(80),
    email,
    password,
  }),
  login: z.strictObject({
    email,
    password: z.string().min(1).max(128),
  }),

  updateGym: z
    .strictObject({
      name: text(80).optional(),
      publicCatalog: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "Send at least one field to change"),
  updateUser: z.strictObject({ role }),

  workoutQuery: z.object({
    mode: text(60).optional(),
    equipment: text(60).toLowerCase().optional(),
    sort: z
      .enum(["name", "-name", "mode", "-mode", "createdAt", "-createdAt", "updatedAt", "-updatedAt"])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  randomWorkoutQuery: z.object({
    mode: text(60).optional(),
    equipment: text(60).toLowerCase().optional(),
  }),
  createWorkout: z.strictObject({
    name: text(80),
    mode: text(60),
    equipment: equipment.default([]),
    exercises: list(30).min(1, "Add at least one exercise"),
    trainerTips: list(20).default([]),
  }),
  updateWorkout: z
    .strictObject({
      name: text(80).optional(),
      mode: text(60).optional(),
      equipment: equipment.optional(),
      exercises: list(30).min(1, "Add at least one exercise").optional(),
      trainerTips: list(20).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "Send at least one field to change"),

  memberQuery: z.object({
    email: email.optional(),
    gender: text(30).optional(),
  }),
  createMember: z.strictObject({
    name: text(80),
    email,
    gender: text(30).optional(),
    dateOfBirth: z.iso.date().optional(),
  }),
  updateMember: z
    .strictObject({
      name: text(80).optional(),
      email: email.optional(),
      gender: text(30).nullable().optional(),
      dateOfBirth: z.iso.date().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "Send at least one field to change"),

  recordQuery: z.object({
    memberId: text(64).optional(),
    workoutId: text(64).optional(),
  }),
  createRecord: z.strictObject({
    memberId: text(64),
    workoutId: text(64),
    result: text(60),
  }),
  updateRecord: z.strictObject({ result: text(60) }),
  logOwnResult: z.strictObject({ result: text(60) }),
};

// Throws a 400 listing every problem, e.g. [{ field: "email", message: "Invalid email address" }]
function parse(schema, input) {
  const parsed = schema.safeParse(input ?? {});
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues.map((issue) => ({
    field: issue.path.join(".") || null,
    message: issue.message,
  }));
  throw badRequest("The request has invalid fields", issues);
}

module.exports = { schemas, parse };
