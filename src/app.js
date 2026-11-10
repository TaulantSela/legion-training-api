require("./config");
const express = require("express");
const authRoutes = require("./routes/auth");
const meRoutes = require("./routes/me");
const { gymRouter, usersRouter } = require("./routes/gym");
const workoutRoutes = require("./routes/workouts");
const memberRoutes = require("./routes/members");
const recordRoutes = require("./routes/records");
const publicRoutes = require("./routes/public");
const { errorHandler, notFoundHandler } = require("./middleware/errors");
const { spec } = require("./openapi");
const { landingPage } = require("./pages/landing");
const { docsPage } = require("./pages/docs");
const { logoSvg } = require("./branding/logo");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

const landing = (req, res) => {
  res.type("html").send(landingPage({ host: req.get("host"), protocol: req.get("x-forwarded-proto") || req.protocol }));
};
app.get("/", landing);
app.get("/api", landing);
app.get("/api/v1", landing);
app.get("/logo.svg", (_req, res) => {
  res.type("image/svg+xml").set("Cache-Control", "public, max-age=86400").send(logoSvg);
});
app.get("/favicon.ico", (_req, res) => res.redirect(301, "/logo.svg"));
app.get("/api/v1/docs", (_req, res) => res.type("html").send(docsPage));
app.get("/api/v1/docs.json", (_req, res) => res.json(spec));

const v1 = express.Router();
v1.use("/auth", authRoutes);
v1.use("/me", meRoutes);
v1.use("/gym", gymRouter);
v1.use("/users", usersRouter);
v1.use("/workouts", workoutRoutes);
v1.use("/members", memberRoutes);
v1.use("/records", recordRoutes);
v1.use("/", publicRoutes);
app.use("/api/v1", v1);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
