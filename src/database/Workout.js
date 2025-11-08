// In src/database/Workout.js
const DB = require("./db.json");
const { saveToDatabase } = require("./utils");

/**
 * @openapi
 * components:
 *   schemas:
 *     Workout:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 61dbae02-c147-4e28-863c-db7bd402b2d6
 *         name:
 *           type: string
 *           example: Tommy V
 *         mode:
 *           type: string
 *           example: For Time
 *         equipment:
 *           type: array
 *           items:
 *             type: string
 *           example: ["barbell", "rope"]
 *         exercises:
 *           type: array
 *           items:
 *             type: string
 *           example: ["21 thrusters", "12 rope climbs, 15 ft", "15 thrusters", "9 rope climbs, 15 ft", "9 thrusters", "6 rope climbs, 15 ft"]
 *         createdAt:
 *           type: string
 *           example: 4/20/2022, 2:21:56 PM
 *         updatedAt:
 *           type: string
 *           example: 4/20/2022, 2:21:56 PM
 *         trainerTips:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Split the 21 thrusters as needed", "Try to do the 9 and 6 thrusters unbroken", "RX Weights: 115lb/75lb"]
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkoutInput:
 *       type: object
 *       required:
 *         - name
 *         - mode
 *         - equipment
 *         - exercises
 *         - trainerTips
 *       properties:
 *         name:
 *           type: string
 *         mode:
 *           type: string
 *         equipment:
 *           type: array
 *           items:
 *             type: string
 *         exercises:
 *           type: array
 *           items:
 *             type: string
 *         trainerTips:
 *           type: array
 *           items:
 *             type: string
 *     WorkoutUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         mode:
 *           type: string
 *         equipment:
 *           type: array
 *           items:
 *             type: string
 *         exercises:
 *           type: array
 *           items:
 *             type: string
 *         trainerTips:
 *           type: array
 *           items:
 *             type: string
 *     ApiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: OK
 *         data:
 *           description: Payload varies per endpoint
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: FAILED
 *         data:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: Some error message
 */

const SUPPORTED_SORT_FIELDS = ["name", "mode", "createdAt", "updatedAt"];
const DATE_FIELDS = new Set(["createdAt", "updatedAt"]);

const toNumberIfDate = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const getAllWorkouts = (filterParams) => {
  const { mode, equipment, length, page, sort } = filterParams;
  try {
    let workouts = [...DB.workouts];

    if (mode) {
      const normalizedMode = mode.toLowerCase();
      workouts = workouts.filter((workout) =>
        workout.mode.toLowerCase().includes(normalizedMode)
      );
    }

    if (equipment) {
      const equipmentFilters = equipment
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      if (equipmentFilters.length) {
        workouts = workouts.filter((workout) => {
          const workoutEquipment = (workout.equipment || []).map((item) =>
            item.toLowerCase()
          );
          return equipmentFilters.every((needle) =>
            workoutEquipment.includes(needle)
          );
        });
      }
    }

    if (sort) {
      const sortFieldRaw = sort.trim();
      const sortDirection = sortFieldRaw.startsWith("-") ? -1 : 1;
      const sortField =
        sortDirection === -1 ? sortFieldRaw.slice(1) : sortFieldRaw;

      if (!SUPPORTED_SORT_FIELDS.includes(sortField)) {
        throw {
          status: 400,
          message: `Sort parameter '${sortField}' is not supported`,
        };
      }

      workouts.sort((first, second) => {
        const firstValue = DATE_FIELDS.has(sortField)
          ? toNumberIfDate(first[sortField])
          : normalize(first[sortField]);
        const secondValue = DATE_FIELDS.has(sortField)
          ? toNumberIfDate(second[sortField])
          : normalize(second[sortField]);

        if (firstValue === undefined && secondValue === undefined) return 0;
        if (firstValue === undefined) return 1 * sortDirection;
        if (secondValue === undefined) return -1 * sortDirection;

        if (DATE_FIELDS.has(sortField)) {
          return (firstValue - secondValue) * sortDirection;
        }

        if (firstValue === secondValue) return 0;
        return firstValue > secondValue ? 1 * sortDirection : -1 * sortDirection;
      });
    }

    let limit;
    if (length !== undefined) {
      limit = parseInt(length, 10);
      if (Number.isNaN(limit) || limit <= 0) {
        throw {
          status: 400,
          message: "Query parameter 'length' must be a positive integer",
        };
      }
    }

    let pageNumber;
    if (page !== undefined) {
      pageNumber = parseInt(page, 10);
      if (Number.isNaN(pageNumber) || pageNumber <= 0) {
        throw {
          status: 400,
          message: "Query parameter 'page' must be a positive integer",
        };
      }
    }

    if (pageNumber) {
      const effectiveLimit = limit ?? 10;
      const startIndex = (pageNumber - 1) * effectiveLimit;
      const endIndex = startIndex + effectiveLimit;
      workouts = workouts.slice(startIndex, endIndex);
    } else if (limit) {
      workouts = workouts.slice(0, limit);
    }

    return workouts;
  } catch (error) {
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const getOneWorkout = (workoutId) => {
  try {
    const workout = DB.workouts.find((workout) => workout.id === workoutId);
    if (!workout) {
      throw {
        status: 404,
        message: `Can't find workout with the id '${workoutId}'`,
      };
    }
    return workout;
  } catch (error) {
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const createNewWorkout = (newWorkout) => {
  try {
    const normalizedName = newWorkout.name.trim().toLowerCase();
    const isAlreadyAdded = DB.workouts.some(
      (workout) => workout.name.trim().toLowerCase() === normalizedName
    );
    if (isAlreadyAdded) {
      throw {
        status: 400,
        message: `Workout with the name '${newWorkout.name}' already exists`,
      };
    }
    DB.workouts.push(newWorkout);
    saveToDatabase(DB);
    return newWorkout;
  } catch (error) {
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const updateOneWorkout = (workoutId, changes) => {
  try {
    const indexForUpdate = DB.workouts.findIndex(
      (workout) => workout.id === workoutId
    );
    if (indexForUpdate === -1) {
      throw {
        status: 404,
        message: `Can't find workout with the id '${workoutId}'`,
      };
    }

    const sanitizedChanges = { ...changes };
    delete sanitizedChanges.id;
    delete sanitizedChanges.createdAt;
    delete sanitizedChanges.updatedAt;

    if (sanitizedChanges.name) {
      const normalizedName = sanitizedChanges.name.trim().toLowerCase();
      const duplicateName = DB.workouts.some(
        (workout) =>
          workout.id !== workoutId &&
          workout.name.trim().toLowerCase() === normalizedName
      );
      if (duplicateName) {
        throw {
          status: 400,
          message: `Workout with the name '${sanitizedChanges.name}' already exists`,
        };
      }
    }

    const updatedWorkout = {
      ...DB.workouts[indexForUpdate],
      ...sanitizedChanges,
      updatedAt: new Date().toLocaleString("en-US", { timeZone: "UTC" }),
    };

    DB.workouts[indexForUpdate] = updatedWorkout;
    saveToDatabase(DB);
    return updatedWorkout;
  } catch (error) {
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const deleteOneWorkout = (workoutId) => {
  try {
    const indexForDeletion = DB.workouts.findIndex(
      (workout) => workout.id === workoutId
    );
    if (indexForDeletion === -1) {
      throw {
        status: 404,
        message: `Can't find workout with the id '${workoutId}'`,
      };
    }
    DB.workouts.splice(indexForDeletion, 1);
    saveToDatabase(DB);
  } catch (error) {
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

module.exports = {
  getAllWorkouts,
  createNewWorkout,
  getOneWorkout,
  updateOneWorkout,
  deleteOneWorkout,
};
