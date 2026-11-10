const { randomInt } = require("node:crypto");
const prisma = require("../db");
const { conflict, notFound } = require("../errors");

const workoutView = (workout) => ({
  id: workout.id,
  name: workout.name,
  mode: workout.mode,
  equipment: workout.equipment,
  exercises: workout.exercises,
  trainerTips: workout.trainerTips,
  createdAt: workout.createdAt,
  updatedAt: workout.updatedAt,
});

const whereFor = (organizationId, { mode, equipment } = {}) => ({
  organizationId,
  ...(mode ? { mode: { contains: mode, mode: "insensitive" } } : {}),
  ...(equipment ? { equipment: { has: equipment } } : {}),
});

const orderFor = (sort) => {
  if (!sort) return [{ name: "asc" }];
  const field = sort.replace(/^-/, "");
  return [{ [field]: sort.startsWith("-") ? "desc" : "asc" }, { id: "asc" }];
};

const missing = (id) => notFound(`No workout with id '${id}' in your gym`);
const duplicateName = (name) => conflict(`Your gym already has a workout called '${name}'`);

async function listWorkouts(organizationId, { page, limit, sort, ...filters }) {
  const where = whereFor(organizationId, filters);
  const [items, total] = await prisma.$transaction([
    prisma.workout.findMany({ where, orderBy: orderFor(sort), skip: (page - 1) * limit, take: limit }),
    prisma.workout.count({ where }),
  ]);
  return { items: items.map(workoutView), meta: { page, limit, total } };
}

async function randomWorkout(organizationId, filters) {
  const where = whereFor(organizationId, filters);
  const total = await prisma.workout.count({ where });
  if (total === 0) throw notFound("No workouts match those filters");
  const [workout] = await prisma.workout.findMany({ where, orderBy: { id: "asc" }, skip: randomInt(total), take: 1 });
  return workoutView(workout);
}

async function getWorkout(organizationId, id) {
  const workout = await prisma.workout.findFirst({ where: { id, organizationId } });
  if (!workout) throw missing(id);
  return workoutView(workout);
}

async function createWorkout(organizationId, data) {
  try {
    return workoutView(await prisma.workout.create({ data: { ...data, organizationId } }));
  } catch (error) {
    if (error.code === "P2002") throw duplicateName(data.name);
    throw error;
  }
}

async function updateWorkout(organizationId, id, changes) {
  try {
    const workout = await prisma.workout.update({
      where: { id_organizationId: { id, organizationId } },
      data: changes,
    });
    return workoutView(workout);
  } catch (error) {
    if (error.code === "P2025") throw missing(id);
    if (error.code === "P2002") throw duplicateName(changes.name);
    throw error;
  }
}

async function deleteWorkout(organizationId, id) {
  try {
    await prisma.workout.delete({ where: { id_organizationId: { id, organizationId } } });
  } catch (error) {
    if (error.code === "P2025") throw missing(id);
    throw error;
  }
}

module.exports = {
  workoutView,
  listWorkouts,
  randomWorkout,
  getWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
};
