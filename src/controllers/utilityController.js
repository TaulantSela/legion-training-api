const workoutService = require("../services/workoutService");

const getHealth = (_req, res) => {
  res.send({ status: "OK", data: { service: "legion", healthy: true } });
};

const getRandomWorkout = (req, res) => {
  const { mode, equipment } = req.query;
  try {
    const workout = workoutService.getRandomWorkout({ mode, equipment });
    res.send({ status: "OK", data: workout });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

module.exports = {
  getHealth,
  getRandomWorkout,
};
