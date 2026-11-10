const { Router } = require("express");
const members = require("../services/members");
const records = require("../services/records");
const { authenticate, requireRole } = require("../middleware/auth");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

// Member profiles hold personal details, so only staff see them
const router = Router();
router.use(authenticate, requireRole("admin", "coach"));

router.get("/", async (req, res) => {
  ok(res, await members.listMembers(req.user.organizationId, parse(schemas.memberQuery, req.query)));
});

router.get("/:memberId", async (req, res) => {
  ok(res, await members.getMember(req.user.organizationId, req.params.memberId));
});

router.get("/:memberId/records", async (req, res) => {
  ok(res, await records.listRecordsFor(req.user.organizationId, { memberId: req.params.memberId }));
});

router.post("/", async (req, res) => {
  ok(res, await members.createMember(req.user.organizationId, parse(schemas.createMember, req.body)), {
    status: 201,
  });
});

router.patch("/:memberId", async (req, res) => {
  const changes = parse(schemas.updateMember, req.body);
  ok(res, await members.updateMember(req.user.organizationId, req.params.memberId, changes));
});

router.delete("/:memberId", async (req, res) => {
  await members.deleteMember(req.user.organizationId, req.params.memberId);
  res.status(204).end();
});

module.exports = router;
