const prisma = require("../db");
const { conflict, notFound } = require("../errors");

// Members never had a reason to carry a password: logins live on User
const memberView = (member) => ({
  id: member.id,
  name: member.name,
  email: member.email,
  gender: member.gender,
  dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : null,
  hasLogin: Boolean(member.user),
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
});

const withLogin = { user: { select: { id: true } } };
const toDate = (value) => (value ? new Date(`${value}T00:00:00Z`) : value);
const missing = (id) => notFound(`No member with id '${id}' in your gym`);
const duplicateEmail = (email) => conflict(`Your gym already has a member with the email '${email}'`);

async function listMembers(organizationId, { email, gender }) {
  const members = await prisma.member.findMany({
    where: {
      organizationId,
      ...(email ? { email } : {}),
      ...(gender ? { gender: { equals: gender, mode: "insensitive" } } : {}),
    },
    include: withLogin,
    orderBy: { name: "asc" },
  });
  return members.map(memberView);
}

async function getMember(organizationId, id) {
  const member = await prisma.member.findFirst({ where: { id, organizationId }, include: withLogin });
  if (!member) throw missing(id);
  return memberView(member);
}

async function createMember(organizationId, { dateOfBirth, ...data }) {
  try {
    const member = await prisma.member.create({
      data: { ...data, dateOfBirth: toDate(dateOfBirth), organizationId },
      include: withLogin,
    });
    return memberView(member);
  } catch (error) {
    if (error.code === "P2002") throw duplicateEmail(data.email);
    throw error;
  }
}

async function updateMember(organizationId, id, { dateOfBirth, ...changes }) {
  try {
    const member = await prisma.member.update({
      where: { id_organizationId: { id, organizationId } },
      data: { ...changes, ...(dateOfBirth !== undefined ? { dateOfBirth: toDate(dateOfBirth) } : {}) },
      include: withLogin,
    });
    return memberView(member);
  } catch (error) {
    if (error.code === "P2025") throw missing(id);
    if (error.code === "P2002") throw duplicateEmail(changes.email);
    throw error;
  }
}

// Removes the member's records too. A linked login stays, but loses its profile.
async function deleteMember(organizationId, id) {
  try {
    await prisma.member.delete({ where: { id_organizationId: { id, organizationId } } });
  } catch (error) {
    if (error.code === "P2025") throw missing(id);
    throw error;
  }
}

module.exports = { listMembers, getMember, createMember, updateMember, deleteMember };
