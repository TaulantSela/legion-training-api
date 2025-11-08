const prisma = require("./client");

const withLegacyMemberLink = (record) => ({
  ...record,
  member: `/members/${record.memberId}`,
});

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

const getAllRecords = async ({ workoutId, memberId } = {}) => {
  try {
    const where = {};
    if (workoutId) where.workoutId = workoutId;
    if (memberId) where.memberId = memberId;

    const records = await prisma.record.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return records.map(withLegacyMemberLink);
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const getRecordForWorkout = async (workoutId) => {
  try {
    const records = await prisma.record.findMany({
      where: { workoutId },
      orderBy: { createdAt: "desc" },
    });
    if (!records.length) {
      throw {
        status: 404,
        message: `Can't find records for workout with the id '${workoutId}'`,
      };
    }
    return records.map(withLegacyMemberLink);
  } catch (error) {
    if (error?.status) throw error;
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const getOneRecord = async (recordId) => {
  try {
    const record = await prisma.record.findUnique({ where: { id: recordId } });
    if (!record) {
      throw {
        status: 404,
        message: `Can't find record with the id '${recordId}'`,
      };
    }
    return withLegacyMemberLink(record);
  } catch (error) {
    if (error?.status) throw error;
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const createNewRecord = async (newRecord) => {
  try {
    const record = await prisma.record.create({
      data: {
        id: newRecord.id,
        workoutId: newRecord.workout,
        record: newRecord.record,
        memberId: newRecord.memberId,
      },
    });
    return withLegacyMemberLink(record);
  } catch (error) {
    if (error.code === "P2002") {
      throw {
        status: 400,
        message: `Member '${newRecord.memberId}' already has a record for workout '${newRecord.workout}'`,
      };
    }
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const updateOneRecord = async (recordId, changes) => {
  let existing;
  try {
    existing = await prisma.record.findUnique({ where: { id: recordId } });
    if (!existing) {
      throw {
        status: 404,
        message: `Can't find record with the id '${recordId}'`,
      };
    }

    const data = {};
    if (changes.workout !== undefined) data.workoutId = changes.workout;
    if (changes.record !== undefined) data.record = changes.record;
    if (changes.memberId !== undefined) data.memberId = changes.memberId;

    if (Object.keys(data).length === 0) {
      return withLegacyMemberLink(existing);
    }

    const record = await prisma.record.update({
      where: { id: recordId },
      data,
    });
    return withLegacyMemberLink(record);
  } catch (error) {
    if (error.code === "P2002") {
      const nextMemberId = changes.memberId ?? existing?.memberId;
      const nextWorkoutId = changes.workout ?? existing?.workoutId;
      throw {
        status: 400,
        message: `Member '${nextMemberId}' already has a record for workout '${nextWorkoutId}'`,
      };
    }
    if (error?.status) throw error;
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const deleteOneRecord = async (recordId) => {
  try {
    await prisma.record.delete({ where: { id: recordId } });
  } catch (error) {
    if (error.code === "P2025") {
      throw {
        status: 404,
        message: `Can't find record with the id '${recordId}'`,
      };
    }
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
