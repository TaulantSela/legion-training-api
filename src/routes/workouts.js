const { Router } = require("express");
const workouts = require("../services/workouts");
const records = require("../services/records");
const { authenticate, requireRole } = require("../middleware/auth");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

const router = Router();
const staff = requireRole("admin", "coach");
router.use(authenticate);

router.get("/", async (req, res) => {
  const { items, meta } = await workouts.listWorkouts(req.user.organizationId, parse(schemas.workoutQuery, req.query));
  ok(res, items, { meta });
});

router.get("/random", async (req, res) => {
  ok(res, await workouts.randomWorkout(req.user.organizationId, parse(schemas.randomWorkoutQuery, req.query)));
});

router.get("/:workoutId", async (req, res) => {
  ok(res, await workouts.getWorkout(req.user.organizationId, req.params.workoutId));
});

router.get("/:workoutId/records", async (req, res) => {
  ok(res, await records.listRecordsFor(req.user.organizationId, { workoutId: req.params.workoutId }));
});

router.post("/", staff, async (req, res) => {
  ok(res, await workouts.createWorkout(req.user.organizationId, parse(schemas.createWorkout, req.body)), {
    status: 201,
  });
});

router.patch("/:workoutId", staff, async (req, res) => {
  const changes = parse(schemas.updateWorkout, req.body);
  ok(res, await workouts.updateWorkout(req.user.organizationId, req.params.workoutId, changes));
});

router.delete("/:workoutId", staff, async (req, res) => {
  await workouts.deleteWorkout(req.user.organizationId, req.params.workoutId);
  res.status(204).end();
});

module.exports = router;
