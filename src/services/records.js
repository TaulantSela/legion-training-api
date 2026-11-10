const prisma = require("../db");
const { badRequest, conflict, notFound } = require("../errors");

const include = {
  member: { select: { id: true, name: true } },
  workout: { select: { id: true, name: true } },
};

const recordView = (record) => ({
  id: record.id,
  result: record.result,
  member: record.member,
  workout: record.workout,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const missing = (id) => notFound(`No record with id '${id}' in your gym`);

async function listRecords(organizationId, { memberId, workoutId } = {}) {
  const records = await prisma.record.findMany({
    where: { organizationId, ...(memberId ? { memberId } : {}), ...(workoutId ? { workoutId } : {}) },
    include,
    orderBy: { updatedAt: "desc" },
  });
  return records.map(recordView);
}

// For /workouts/{id}/records and /members/{id}/records, where an unknown parent should be a 404
async function listRecordsFor(organizationId, { memberId, workoutId }) {
  if (workoutId && !(await prisma.workout.findFirst({ where: { id: workoutId, organizationId } }))) {
    throw notFound(`No workout with id '${workoutId}' in your gym`);
  }
  if (memberId && !(await prisma.member.findFirst({ where: { id: memberId, organizationId } }))) {
    throw notFound(`No member with id '${memberId}' in your gym`);
  }
  return listRecords(organizationId, { memberId, workoutId });
}

async function getRecord(organizationId, id) {
  const record = await prisma.record.findFirst({ where: { id, organizationId }, include });
  if (!record) throw missing(id);
  return recordView(record);
}

async function createRecord(organizationId, { memberId, workoutId, result }) {
  const [member, workout] = await Promise.all([
    prisma.member.findFirst({ where: { id: memberId, organizationId }, select: { id: true } }),
    prisma.workout.findFirst({ where: { id: workoutId, organizationId }, select: { id: true } }),
  ]);
  if (!member) throw badRequest(`No member with id '${memberId}' in your gym`);
  if (!workout) throw badRequest(`No workout with id '${workoutId}' in your gym`);

  try {
    const record = await prisma.record.create({ data: { organizationId, memberId, workoutId, result }, include });
    return recordView(record);
  } catch (error) {
    if (error.code === "P2002") {
      throw conflict("This member already has a record for this workout. Update that one instead.");
    }
    throw error;
  }
}

async function updateRecord(organizationId, id, { result }) {
  const { count } = await prisma.record.updateMany({ where: { id, organizationId }, data: { result } });
  if (count === 0) throw missing(id);
  return getRecord(organizationId, id);
}

async function deleteRecord(organizationId, id) {
  const { count } = await prisma.record.deleteMany({ where: { id, organizationId } });
  if (count === 0) throw missing(id);
}

const requireProfile = (user) => {
  if (!user.memberId) {
    throw conflict("Your account isn't linked to a member profile, so there's nothing to log results against");
  }
  return user.memberId;
};

async function listOwnRecords(user) {
  return listRecords(user.organizationId, { memberId: requireProfile(user) });
}

// Athletes log their own result. Logging the same workout again replaces the result.
async function logOwnResult(user, workoutId, result) {
  const memberId = requireProfile(user);
  const organizationId = user.organizationId;
  const workout = await prisma.workout.findFirst({ where: { id: workoutId, organizationId }, select: { id: true } });
  if (!workout) throw notFound(`No workout with id '${workoutId}' in your gym`);

  const existing = await prisma.record.findUnique({ where: { memberId_workoutId: { memberId, workoutId } } });
  const record = await prisma.record.upsert({
    where: { memberId_workoutId: { memberId, workoutId } },
    create: { organizationId, memberId, workoutId, result },
    update: { result },
    include,
  });
  return { record: recordView(record), created: !existing };
}

module.exports = {
  listRecords,
  listRecordsFor,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  listOwnRecords,
  logOwnResult,
};
