const { Router } = require("express");
const records = require("../services/records");
const { authenticate, requireRole } = require("../middleware/auth");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

// Everyone in the gym can see results (it's the leaderboard). Staff manage them.
const router = Router();
const staff = requireRole("admin", "coach");
router.use(authenticate);

router.get("/", async (req, res) => {
  ok(res, await records.listRecords(req.user.organizationId, parse(schemas.recordQuery, req.query)));
});

router.get("/:recordId", async (req, res) => {
  ok(res, await records.getRecord(req.user.organizationId, req.params.recordId));
});

router.post("/", staff, async (req, res) => {
  ok(res, await records.createRecord(req.user.organizationId, parse(schemas.createRecord, req.body)), {
    status: 201,
  });
});

router.patch("/:recordId", staff, async (req, res) => {
  const changes = parse(schemas.updateRecord, req.body);
  ok(res, await records.updateRecord(req.user.organizationId, req.params.recordId, changes));
});

router.delete("/:recordId", staff, async (req, res) => {
  await records.deleteRecord(req.user.organizationId, req.params.recordId);
  res.status(204).end();
});

module.exports = router;
