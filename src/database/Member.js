const prisma = require("./client");

const getAllMembers = async ({ gender, email } = {}) => {
  try {
    const where = {};
    if (gender) {
      where.gender = { equals: gender, mode: "insensitive" };
    }
    if (email) {
      where.email = { equals: email, mode: "insensitive" };
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return members;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error.message || error,
    };
  }
};

const getOneMember = async (memberId) => {
  try {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw {
        status: 404,
        message: `Can't find member with the id '${memberId}'`,
      };
    }
    return member;
  } catch (error) {
    if (error?.status) throw error;
    throw {
      status: error?.status || 500,
      message: error?.message || error.message || error,
    };
  }
};

const createNewMember = async (newMember) => {
  try {
    const createdMember = await prisma.member.create({
      data: {
        id: newMember.id,
        name: newMember.name,
        gender: newMember.gender || null,
        dateOfBirth: newMember.dateOfBirth || null,
        email: newMember.email,
        password: newMember.password,
      },
    });
    return createdMember;
  } catch (error) {
    if (error.code === "P2002") {
      throw {
        status: 400,
        message: `Member with the email '${newMember.email}' already exists`,
      };
    }
    throw {
      status: error?.status || 500,
      message: error?.message || error.message || error,
    };
  }
};

const updateOneMember = async (memberId, changes) => {
  try {
    const data = {};
    if (changes.name !== undefined) data.name = changes.name;
    if (changes.gender !== undefined) data.gender = changes.gender;
    if (changes.dateOfBirth !== undefined) data.dateOfBirth = changes.dateOfBirth;
    if (changes.email !== undefined) data.email = changes.email;
    if (changes.password !== undefined) data.password = changes.password;

    if (Object.keys(data).length === 0) {
      return getOneMember(memberId);
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data,
    });
    return updatedMember;
  } catch (error) {
    if (error.code === "P2025") {
      throw {
        status: 404,
        message: `Can't find member with the id '${memberId}'`,
      };
    }
    if (error.code === "P2002" && changes.email) {
      throw {
        status: 400,
        message: `Member with the email '${changes.email}' already exists`,
      };
    }
    throw {
      status: error?.status || 500,
      message: error?.message || error.message || error,
    };
  }
};

const deleteOneMember = async (memberId) => {
  try {
    await prisma.member.delete({ where: { id: memberId } });
  } catch (error) {
    if (error.code === "P2025") {
      throw {
        status: 404,
        message: `Can't find member with the id '${memberId}'`,
      };
    }
    throw {
      status: error?.status || 500,
      message: error?.message || error.message || error,
    };
  }
};

module.exports = {
  getAllMembers,
  getOneMember,
  createNewMember,
  updateOneMember,
  deleteOneMember,
};
