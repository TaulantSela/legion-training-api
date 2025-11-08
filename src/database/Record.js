const DB = require("./db.json");

/**
 * @openapi
 * components:
 *   schemas:
 *     Record:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: ad75d475-ac57-44f4-a02a-8f6def58ff56
 *         workout:
 *           type: string
 *           example: 4a3d9aaa-608c-49a7-a004-66305ad4ab50
 *         record:
 *           type: string
 *           example: 160 reps
 *         memberId:
 *           type: string
 *           example: 11817fb1-03a1-4b4a-8d27-854ac893cf41
 */

const getRecordForWorkout = (workoutId) => {
  try {
    const records = DB.records.filter((record) => record.workout === workoutId);
    if (!records.length) {
      throw {
        status: 404,
        message: `Can't find records for workout with the id '${workoutId}'`,
      };
    }
    return records;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

module.exports = { getRecordForWorkout };
