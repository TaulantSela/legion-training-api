const { randomBytes, randomInt } = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Prisma } = require("@prisma/client");
const prisma = require("../db");
const { jwtExpiresIn, jwtSecret } = require("../config");
const { badRequest, conflict, unauthorized } = require("../errors");

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so a miss takes as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString("hex"), BCRYPT_ROUNDS);
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

const issueToken = (user) =>
  jwt.sign({ sub: user.id }, jwtSecret, { algorithm: "HS256", expiresIn: jwtExpiresIn });

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  organizationId: user.organizationId,
  memberId: user.memberId ?? null,
});

const isUniqueViolation = (error, field) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002" &&
  [].concat(error.meta?.target ?? []).some((target) => String(target).includes(field));

function newInviteCode() {
  const pick = () => Array.from({ length: 4 }, () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)]).join("");
  return `${pick()}-${pick()}`;
}

function slugify(name) {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "gym";
}

// Anyone can open a gym. They become its admin, so they only ever control their own data.
async function registerGym({ gymName, name, email, password }) {
  const passwordHash = await hashPassword(password);
  const baseSlug = slugify(gymName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomInt(1000, 9999)}`;
    try {
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "admin",
          organization: { create: { name: gymName, slug, inviteCode: newInviteCode() } },
        },
        include: { organization: true },
      });
      return {
        token: issueToken(user),
        user: publicUser(user),
        gym: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          inviteCode: user.organization.inviteCode,
        },
      };
    } catch (error) {
      if (isUniqueViolation(error, "email")) throw conflict("An account with this email already exists");
      if (isUniqueViolation(error, "slug") || isUniqueViolation(error, "inviteCode")) continue;
      throw error;
    }
  }
  throw conflict("Couldn't find a free name for this gym. Try a different name.");
}

// Athletes join with their gym's invite code. If the coach already added them as a member
// with the same email, the new login is linked to that profile.
async function registerAthlete({ inviteCode, name, email, password }) {
  const gym = await prisma.organization.findUnique({ where: { inviteCode } });
  if (!gym) throw badRequest("No gym uses that invite code. Ask your coach for the current one.");

  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.member.findUnique({
        where: { organizationId_email: { organizationId: gym.id, email } },
        include: { user: { select: { id: true } } },
      });
      if (existing?.user) throw conflict("This member profile already has a login");

      const member = existing ?? (await tx.member.create({ data: { organizationId: gym.id, name, email } }));
      return tx.user.create({
        data: { email, name, passwordHash, role: "athlete", organizationId: gym.id, memberId: member.id },
      });
    });
    return {
      token: issueToken(user),
      user: publicUser(user),
      gym: { id: gym.id, name: gym.name, slug: gym.slug },
    };
  } catch (error) {
    if (isUniqueViolation(error, "email")) throw conflict("An account with this email already exists");
    throw error;
  }
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw unauthorized("Wrong email or password");
  return { token: issueToken(user), user: publicUser(user) };
}

module.exports = { registerGym, registerAthlete, login, hashPassword, newInviteCode, publicUser };
