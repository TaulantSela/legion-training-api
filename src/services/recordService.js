const { v4: uuid } = require("uuid");
const Record = require("../database/Record");

const getAllRecords = async (filters) => {
  try {
    const records = await Record.getAllRecords(filters);
    return records;
  } catch (error) {
    throw error;
  }
};

const getRecordForWorkout = async (workoutId) => {
  try {
    const record = await Record.getRecordForWorkout(workoutId);
    return record;
  } catch (error) {
    throw error;
  }
};

const getOneRecord = async (recordId) => {
  try {
    const record = await Record.getOneRecord(recordId);
    return record;
  } catch (error) {
    throw error;
  }
};

const createNewRecord = async (newRecord) => {
  const recordToInsert = {
    ...newRecord,
    id: uuid(),
  };
  try {
    const createdRecord = await Record.createNewRecord(recordToInsert);
    return createdRecord;
  } catch (error) {
    throw error;
  }
};

const updateOneRecord = async (recordId, changes) => {
  try {
    const updatedRecord = await Record.updateOneRecord(recordId, changes);
    return updatedRecord;
  } catch (error) {
    throw error;
  }
};

const deleteOneRecord = async (recordId) => {
  try {
    await Record.deleteOneRecord(recordId);
  } catch (error) {
    throw error;
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
