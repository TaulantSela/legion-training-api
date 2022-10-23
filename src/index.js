const express = require("express");
const bodyParser = require("body-parser");
const apicache = require("apicache");
const v1WorkoutRouter = require("./v1/routes/workoutRoutes");
const v1MemberRouter = require("./v1/routes/memberRoutes");

//  data cache => redis / apicache

const app = express();
const cache = apicache.middleware;
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cache("2 minutes"));
app.use("/api/v1/workouts", v1WorkoutRouter);
app.use("/api/v1/members", v1MemberRouter);

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});

/* 
CACHE 
A few things you have to be aware of when using a cache:

  * you always have to make sure that the data inside the cache is up to date because you don't want to serve outdated data
  * while the first request is being processed and the cache is about to be filled and more requests are coming in, you have to decide if you delay those other requests and serve the data from the cache or if they also receive data straight from the database like the first request
  * it's another component inside your infrastructure if you're choosing a distributed cache like Redis (so you have to ask yourself if it really makes sense to use it)
*/
