const DB = require("./db.json");
const { saveToDatabase } = require("./utils");

const findByEmail = (email) => {
  try {
    return DB.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const getOneUser = (userId) => {
  try {
    const user = DB.users.find((entry) => entry.id === userId);
    if (!user) {
      throw {
        status: 404,
        message: `Can't find user with the id '${userId}'`,
      };
    }
    return user;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const createUser = (newUser) => {
  try {
    const exists = DB.users.some(
      (entry) => entry.email.toLowerCase() === newUser.email.toLowerCase()
    );
    if (exists) {
      throw {
        status: 400,
        message: `User with the email '${newUser.email}' already exists`,
      };
    }
    DB.users.push(newUser);
    saveToDatabase(DB);
    return newUser;
  } catch (error) {
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
