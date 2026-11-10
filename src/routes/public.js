const { Router } = require("express");
const { timingSafeEqual } = require("node:crypto");
const prisma = require("../db");
const gyms = require("../services/gyms");
const workouts = require("../services/workouts");
const { resetDemo } = require("../services/demo");
const { cronSecret } = require("../config");
const { unauthorized } = require("../errors");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

const router = Router();

router.get("/healthz", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  ok(res, { service: "legion", healthy: true, database: "ok" });
});

// A gym's workout catalogue, readable without an account when the gym turns it on
router.get("/gyms/:slug", async (req, res) => {
  const { id: _id, ...gym } = await gyms.findPublicGym(req.params.slug);
  ok(res, gym);
});

router.get("/gyms/:slug/workouts", async (req, res) => {
  const gym = await gyms.findPublicGym(req.params.slug);
  const { items, meta } = await workouts.listWorkouts(gym.id, parse(schemas.workoutQuery, req.query));
  ok(res, items, { meta });
});

router.get("/gyms/:slug/workouts/random", async (req, res) => {
  const gym = await gyms.findPublicGym(req.params.slug);
  ok(res, await workouts.randomWorkout(gym.id, parse(schemas.randomWorkoutQuery, req.query)));
});

const sameSecret = (given, expected) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Vercel Cron calls this nightly with Authorization: Bearer $CRON_SECRET
router.get("/internal/reset-demo", async (req, res) => {
  const [scheme, token] = (req.get("authorization") || "").split(" ");
  if (!cronSecret || scheme !== "Bearer" || !token || !sameSecret(token, cronSecret)) {
    throw unauthorized("This endpoint is for the scheduled demo reset");
  }
  ok(res, await resetDemo());
});

module.exports = router;
