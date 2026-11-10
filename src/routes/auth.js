const { Router } = require("express");
const auth = require("../services/auth");
const { rateLimit } = require("../middleware/rate-limit");
const { ok } = require("../respond");
const { parse, schemas } = require("../validation");

const router = Router();
const HOUR = 60 * 60 * 1000;
const signUpLimit = rateLimit({ name: "sign-up", max: 10, windowMs: HOUR });
const loginLimit = rateLimit({ name: "login", max: 30, windowMs: 15 * 60 * 1000 });

router.post("/register-gym", signUpLimit, async (req, res) => {
  ok(res, await auth.registerGym(parse(schemas.registerGym, req.body)), { status: 201 });
});

router.post("/register", signUpLimit, async (req, res) => {
  ok(res, await auth.registerAthlete(parse(schemas.registerAthlete, req.body)), { status: 201 });
});

router.post("/login", loginLimit, async (req, res) => {
  ok(res, await auth.login(parse(schemas.login, req.body)));
});

module.exports = router;
