const { Router } = require("express");
const gyms = require("../services/gyms");
const { authenticate, requireRole } = require("../middleware/auth");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

// The signed-in user's own gym and its people
const gymRouter = Router();
gymRouter.use(authenticate);

gymRouter.get("/", async (req, res) => {
  ok(res, await gyms.getGym(req.user));
});

gymRouter.patch("/", requireRole("admin"), async (req, res) => {
  ok(res, await gyms.updateGym(req.user, parse(schemas.updateGym, req.body)));
});

gymRouter.post("/invite-code", requireRole("admin"), async (req, res) => {
  ok(res, await gyms.rotateInviteCode(req.user));
});

const usersRouter = Router();
usersRouter.use(authenticate, requireRole("admin"));

usersRouter.get("/", async (req, res) => {
  ok(res, await gyms.listUsers(req.user.organizationId));
});

usersRouter.patch("/:userId", async (req, res) => {
  const { role } = parse(schemas.updateUser, req.body);
  ok(res, await gyms.changeRole(req.user, req.params.userId, role));
});

module.exports = { gymRouter, usersRouter };
