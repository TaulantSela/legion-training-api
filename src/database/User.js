const prisma = require("./client");

const findByEmail = async (email) => {
  try {
    return await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const getOneUser = async (userId) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw {
        status: 404,
        message: `Can't find user with the id '${userId}'`,
      };
    }
    return user;
  } catch (error) {
    if (error?.status) throw error;
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const createUser = async (newUser) => {
  try {
    const user = await prisma.user.create({
      data: {
        id: newUser.id,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role || null,
        organizationId: newUser.organizationId || null,
        name: newUser.name || null,
      },
    });
    return user;
  } catch (error) {
    if (error.code === "P2002") {
      throw {
        status: 400,
        message: `User with the email '${newUser.email}' already exists`,
      };
    }
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

module.exports = {
  findByEmail,
  getOneUser,
  createUser,
};
