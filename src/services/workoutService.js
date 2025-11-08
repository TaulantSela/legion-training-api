// In src/services/workoutService.js
const { v4: uuid } = require("uuid");
const Workout = require("../database/Workout");

const getAllWorkouts = async (filterParams) => {
  try {
    const allWorkouts = await Workout.getAllWorkouts(filterParams);
    return allWorkouts;
  } catch (error) {
    throw error;
  }
};

const getOneWorkout = async (workoutId) => {
  try {
    const workout = await Workout.getOneWorkout(workoutId);
    return workout;
  } catch (error) {
    throw error;
  }
};

const getRandomWorkout = async (filters) => {
  try {
    const workout = await Workout.getRandomWorkout(filters);
    return workout;
  } catch (error) {
    throw error;
  }
};

const createNewWorkout = async (newWorkout) => {
  const timestamp = new Date().toISOString();
  const workoutToInsert = {
    ...newWorkout,
    id: uuid(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  try {
    const createdWorkout = await Workout.createNewWorkout(workoutToInsert);
    return createdWorkout;
  } catch (error) {
    throw error;
  }
};

const updateOneWorkout = async (workoutId, changes) => {
  try {
    const updatedWorkout = await Workout.updateOneWorkout(workoutId, changes);
    return updatedWorkout;
  } catch (error) {
    throw error;
  }
};

const deleteOneWorkout = async (workoutId) => {
  try {
    await Workout.deleteOneWorkout(workoutId);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllWorkouts,
  getOneWorkout,
  getRandomWorkout,
  createNewWorkout,
  updateOneWorkout,
  deleteOneWorkout,
};
