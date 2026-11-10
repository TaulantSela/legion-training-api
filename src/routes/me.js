const { Router } = require("express");
const prisma = require("../db");
const records = require("../services/records");
const { publicUser } = require("../services/auth");
const { authenticate } = require("../middleware/auth");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user.id },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      member: { select: { id: true, name: true, email: true } },
    },
  });
  ok(res, { ...publicUser(user), gym: user.organization, member: user.member });
});

router.get("/records", async (req, res) => {
  ok(res, await records.listOwnRecords(req.user));
});

// PUT because logging the same workout again replaces your result
router.put("/records/:workoutId", async (req, res) => {
  const { result } = parse(schemas.logOwnResult, req.body);
  const logged = await records.logOwnResult(req.user, req.params.workoutId, result);
  ok(res, logged.record, { status: logged.created ? 201 : 200 });
});

module.exports = router;
