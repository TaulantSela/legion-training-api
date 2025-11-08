// In src/database/Workout.js
const { randomInt } = require("crypto");
const prisma = require("./client");

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

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const buildOrderBy = (sort) => {
  if (!sort) return undefined;
  const sortFieldRaw = sort.trim();
  const direction = sortFieldRaw.startsWith("-") ? "desc" : "asc";
  const field = direction === "desc" ? sortFieldRaw.slice(1) : sortFieldRaw;

  if (!SUPPORTED_SORT_FIELDS.includes(field)) {
    throw {
      status: 400,
      message: `Sort parameter '${field}' is not supported`,
    };
  }

  return [{ [field]: direction }];
};

const buildWhereClause = ({ mode, equipment } = {}) => {
  const where = {};

  if (mode) {
    where.mode = { contains: mode, mode: "insensitive" };
  }

  if (equipment) {
    const filters = equipment
      .split(",")
      .map((item) => normalize(item))
      .filter(Boolean);

    if (filters.length) {
      where.equipment = { hasEvery: filters };
    }
  }

  return where;
};

const getPagination = ({ length, page }) => {
  let take;
  if (length !== undefined) {
    take = parseInt(length, 10);
    if (Number.isNaN(take) || take <= 0) {
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
    const effectiveTake = take ?? 10;
    const skip = (pageNumber - 1) * effectiveTake;
    return { take: effectiveTake, skip };
  }

  return { take, skip: undefined };
};

const getAllWorkouts = async (filterParams = {}) => {
  try {
    const where = buildWhereClause(filterParams);
    const orderBy = buildOrderBy(filterParams.sort);
    const pagination = getPagination(filterParams);

    const workouts = await prisma.workout.findMany({
      where,
      orderBy,
      take: pagination.take,
      skip: pagination.skip,
    });

    return workouts;
  } catch (error) {
    if (error?.status) throw error;
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const getOneWorkout = async (workoutId) => {
  try {
    const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
    if (!workout) {
      throw {
        status: 404,
        message: `Can't find workout with the id '${workoutId}'`,
      };
    }
    return workout;
  } catch (error) {
    if (error?.status) throw error;
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const getRandomWorkout = async (filterParams = {}) => {
  try {
    const candidates = await getAllWorkouts(filterParams);
    if (!candidates.length) {
      throw {
        status: 404,
        message: "No workouts found for the provided filters",
      };
    }
    const index = randomInt(0, candidates.length);
    return candidates[index];
  } catch (error) {
    if (error?.status) throw error;
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const createNewWorkout = async (newWorkout) => {
  try {
    const createdWorkout = await prisma.workout.create({
      data: {
        id: newWorkout.id,
        name: newWorkout.name,
        mode: newWorkout.mode || null,
        equipment: newWorkout.equipment || [],
        exercises: newWorkout.exercises || [],
        trainerTips: newWorkout.trainerTips || [],
        createdAt: newWorkout.createdAt || null,
        updatedAt: newWorkout.updatedAt || null,
      },
    });
    return createdWorkout;
  } catch (error) {
    if (error.code === "P2002") {
      throw {
        status: 400,
        message: `Workout with the name '${newWorkout.name}' already exists`,
      };
    }
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const updateOneWorkout = async (workoutId, changes) => {
  try {
    const updatedWorkout = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        name: changes.name ?? undefined,
        mode: changes.mode ?? undefined,
        equipment: changes.equipment ?? undefined,
        exercises: changes.exercises ?? undefined,
        trainerTips: changes.trainerTips ?? undefined,
        updatedAt: changes.updatedAt ?? new Date().toISOString(),
      },
    });
    return updatedWorkout;
  } catch (error) {
    if (error.code === "P2025") {
      throw {
        status: 404,
        message: `Can't find workout with the id '${workoutId}'`,
      };
    }
    if (error.code === "P2002" && changes.name) {
      throw {
        status: 400,
        message: `Workout with the name '${changes.name}' already exists`,
      };
    }
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

const deleteOneWorkout = async (workoutId) => {
  try {
    await prisma.workout.delete({ where: { id: workoutId } });
  } catch (error) {
    if (error.code === "P2025") {
      throw {
        status: 404,
        message: `Can't find workout with the id '${workoutId}'`,
      };
    }
    throw { status: error?.status || 500, message: error?.message || error };
  }
};

module.exports = {
  getAllWorkouts,
  createNewWorkout,
  getOneWorkout,
  updateOneWorkout,
  deleteOneWorkout,
  getRandomWorkout,
};
