const express = require("express");
const bodyParser = require("body-parser");
const apicache = require("apicache");
const v1AuthRouter = require("./v1/routes/authRoutes");
const v1UtilityRouter = require("./v1/routes/utilityRoutes");
const v1WorkoutRouter = require("./v1/routes/workoutRoutes");
const v1MemberRouter = require("./v1/routes/memberRoutes");
const v1RecordRouter = require("./v1/routes/recordRoutes");
const { swaggerDocs: V1SwaggerDocs } = require("./v1/swagger");

const app = express();
const cache = apicache.middleware;

const cacheMiddleware =
  process.env.NODE_ENV === "test" ? (req, res, next) => next() : cache("2 minutes");

app.use(bodyParser.json());
app.use(cacheMiddleware);
app.use("/api/v1/auth", v1AuthRouter);
app.use("/api/v1", v1UtilityRouter);
app.use("/api/v1/workouts", v1WorkoutRouter);
app.use("/api/v1/members", v1MemberRouter);
app.use("/api/v1/records", v1RecordRouter);

const initDocs = (port = 3000) => {
  V1SwaggerDocs(app, port);
};

module.exports = { app, initDocs };
