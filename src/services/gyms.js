const prisma = require("../db");
const { badRequest, conflict, notFound } = require("../errors");
const { newInviteCode, publicUser } = require("./auth");

const STAFF = ["admin", "coach"];

const gymView = (gym, viewer) => ({
  id: gym.id,
  name: gym.name,
  slug: gym.slug,
  publicCatalog: gym.publicCatalog,
  // Athletes don't need the code, and shouldn't hand it out
  ...(STAFF.includes(viewer.role) ? { inviteCode: gym.inviteCode } : {}),
  createdAt: gym.createdAt,
});

async function getGym(viewer) {
  const gym = await prisma.organization.findUniqueOrThrow({ where: { id: viewer.organizationId } });
  return gymView(gym, viewer);
}

async function updateGym(viewer, changes) {
  const gym = await prisma.organization.update({ where: { id: viewer.organizationId }, data: changes });
  return gymView(gym, viewer);
}

async function rotateInviteCode(viewer) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const gym = await prisma.organization.update({
        where: { id: viewer.organizationId },
        data: { inviteCode: newInviteCode() },
      });
      return gymView(gym, viewer);
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }
  throw conflict("Couldn't generate a new invite code. Try again.");
}

async function listUsers(organizationId) {
  const users = await prisma.user.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
  return users.map(publicUser);
}

async function changeRole(viewer, userId, role) {
  if (userId === viewer.id) throw badRequest("You can't change your own role");
  const target = await prisma.user.findFirst({ where: { id: userId, organizationId: viewer.organizationId } });
  if (!target) throw notFound(`No user with id '${userId}' in your gym`);
  const user = await prisma.user.update({ where: { id: target.id }, data: { role } });
  return publicUser(user);
}

// For the public catalogue. Gyms opt in with publicCatalog.
async function findPublicGym(slug) {
  const gym = await prisma.organization.findUnique({ where: { slug } });
  if (!gym || !gym.publicCatalog) throw notFound(`No public gym called '${slug}'`);
  return { id: gym.id, name: gym.name, slug: gym.slug };
}

module.exports = { getGym, updateGym, rotateInviteCode, listUsers, changeRole, findPublicGym };
