const DB = require("./db.json");
const { saveToDatabase } = require("./utils");

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

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const getAllRecords = ({ workoutId, memberId } = {}) => {
  try {
    let records = [...DB.records];

    if (workoutId) {
      records = records.filter((entry) => entry.workout === workoutId);
    }

    if (memberId) {
      records = records.filter((entry) => entry.memberId === memberId);
    }

    return records;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

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

const getOneRecord = (recordId) => {
  try {
    const record = DB.records.find((entry) => entry.id === recordId);
    if (!record) {
      throw {
        status: 404,
        message: `Can't find record with the id '${recordId}'`,
      };
    }
    return record;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const createNewRecord = (newRecord) => {
  try {
    const duplicate = DB.records.some(
      (entry) =>
        entry.workout === newRecord.workout &&
        normalize(entry.memberId) === normalize(newRecord.memberId)
    );
    if (duplicate) {
      throw {
        status: 400,
        message: `Member '${newRecord.memberId}' already has a record for workout '${newRecord.workout}'`,
      };
    }

    DB.records.push(newRecord);
    saveToDatabase(DB);
    return newRecord;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const updateOneRecord = (recordId, changes) => {
  try {
    const indexForUpdate = DB.records.findIndex((entry) => entry.id === recordId);
    if (indexForUpdate === -1) {
      throw {
        status: 404,
        message: `Can't find record with the id '${recordId}'`,
      };
    }

    const sanitizedChanges = { ...changes };
    delete sanitizedChanges.id;

    const nextWorkoutId = sanitizedChanges.workout || DB.records[indexForUpdate].workout;
    const nextMemberId = sanitizedChanges.memberId || DB.records[indexForUpdate].memberId;

    const duplicate = DB.records.some(
      (entry) =>
        entry.id !== recordId &&
        entry.workout === nextWorkoutId &&
        normalize(entry.memberId) === normalize(nextMemberId)
    );
    if (duplicate) {
      throw {
        status: 400,
        message: `Member '${nextMemberId}' already has a record for workout '${nextWorkoutId}'`,
      };
    }

    const updatedRecord = {
      ...DB.records[indexForUpdate],
      ...sanitizedChanges,
    };

    DB.records[indexForUpdate] = updatedRecord;
    saveToDatabase(DB);
    return updatedRecord;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const deleteOneRecord = (recordId) => {
  try {
    const indexForDeletion = DB.records.findIndex((entry) => entry.id === recordId);
    if (indexForDeletion === -1) {
      throw {
        status: 404,
        message: `Can't find record with the id '${recordId}'`,
      };
    }
    DB.records.splice(indexForDeletion, 1);
    saveToDatabase(DB);
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

module.exports = {
  getAllRecords,
  getRecordForWorkout,
  getOneRecord,
  createNewRecord,
  updateOneRecord,
  deleteOneRecord,
};
