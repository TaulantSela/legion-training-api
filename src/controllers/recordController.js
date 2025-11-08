const recordService = require("../services/recordService");

const getAllRecords = async (req, res) => {
  const { memberId, workoutId } = req.query;
  try {
    const records = await recordService.getAllRecords({ memberId, workoutId });
    res.send({ status: "OK", data: records });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const getRecordForWorkout = async (req, res) => {
  const {
    params: { workoutId },
  } = req;
  if (!workoutId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':workoutId' can not be empty" },
    });
    return;
  }
  try {
    const record = await recordService.getRecordForWorkout(workoutId);
    res.send({ status: "OK", data: record });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const getOneRecord = async (req, res) => {
  const {
    params: { recordId },
  } = req;
  if (!recordId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':recordId' can not be empty" },
    });
    return;
  }
  try {
    const record = await recordService.getOneRecord(recordId);
    res.send({ status: "OK", data: record });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const createNewRecord = async (req, res) => {
  const { body } = req;
  if (!body.workout || !body.memberId || !body.record) {
    res.status(400).send({
      status: "FAILED",
      data: {
        error:
          "One of the following keys is missing or is empty in request body: 'workout', 'memberId', 'record'",
      },
    });
    return;
  }
  try {
    const createdRecord = await recordService.createNewRecord({
      workout: body.workout,
      memberId: body.memberId,
      record: body.record,
    });
    res.status(201).send({ status: "OK", data: createdRecord });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const updateOneRecord = async (req, res) => {
  const {
    params: { recordId },
    body,
  } = req;
  if (!recordId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':recordId' can not be empty" },
    });
    return;
  }
  if (Object.keys(body || {}).length === 0) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Request body can not be empty" },
    });
    return;
  }
  try {
    const updatedRecord = await recordService.updateOneRecord(recordId, body);
    res.send({ status: "OK", data: updatedRecord });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const deleteOneRecord = async (req, res) => {
  const {
    params: { recordId },
  } = req;
  if (!recordId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':recordId' can not be empty" },
    });
    return;
  }
  try {
    await recordService.deleteOneRecord(recordId);
    res.status(204).send();
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
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
