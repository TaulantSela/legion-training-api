const DB = require("./db.json");
const { saveToDatabase } = require("./utils");

/**
 * @openapi
 * components:
 *   schemas:
 *     Member:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 12a410bc-849f-4e7e-bfc8-4ef283ee4b19
 *         name:
 *           type: string
 *           example: Jason Miller
 *         gender:
 *           type: string
 *           example: male
 *         dateOfBirth:
 *           type: string
 *           example: 23/04/1990
 *         email:
 *           type: string
 *           format: email
 *           example: jason@mail.com
 */

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const getAllMembers = ({ gender, email } = {}) => {
  try {
    let members = [...DB.members];

    if (gender) {
      const normalizedGender = gender.toLowerCase();
      members = members.filter(
        (member) => (member.gender || "").toLowerCase() === normalizedGender
      );
    }

    if (email) {
      const normalizedEmail = email.toLowerCase();
      members = members.filter(
        (member) => (member.email || "").toLowerCase() === normalizedEmail
      );
    }

    return members;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const getOneMember = (memberId) => {
  try {
    const member = DB.members.find((member) => member.id === memberId);
    if (!member) {
      throw {
        status: 404,
        message: `Can't find member with the id '${memberId}'`,
      };
    }
    return member;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const createNewMember = (newMember) => {
  try {
    const normalizedEmail = normalize(newMember.email);
    const isAlreadyAdded = DB.members.some(
      (member) => normalize(member.email) === normalizedEmail
    );
    if (isAlreadyAdded) {
      throw {
        status: 400,
        message: `Member with the email '${newMember.email}' already exists`,
      };
    }
    DB.members.push(newMember);
    saveToDatabase(DB);
    return newMember;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const updateOneMember = (memberId, changes) => {
  try {
    const indexForUpdate = DB.members.findIndex(
      (member) => member.id === memberId
    );
    if (indexForUpdate === -1) {
      throw {
        status: 404,
        message: `Can't find member with the id '${memberId}'`,
      };
    }

    const sanitizedChanges = { ...changes };
    delete sanitizedChanges.id;

    if (sanitizedChanges.email) {
      const normalizedEmail = normalize(sanitizedChanges.email);
      const duplicateEmail = DB.members.some(
        (member) =>
          member.id !== memberId && normalize(member.email) === normalizedEmail
      );
      if (duplicateEmail) {
        throw {
          status: 400,
          message: `Member with the email '${sanitizedChanges.email}' already exists`,
        };
      }
    }

    const updatedMember = {
      ...DB.members[indexForUpdate],
      ...sanitizedChanges,
    };

    DB.members[indexForUpdate] = updatedMember;
    saveToDatabase(DB);
    return updatedMember;
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
    };
  }
};

const deleteOneMember = (memberId) => {
  try {
    const indexForDeletion = DB.members.findIndex(
      (member) => member.id === memberId
    );
    if (indexForDeletion === -1) {
      throw {
        status: 404,
        message: `Can't find member with the id '${memberId}'`,
      };
    }
    DB.members.splice(indexForDeletion, 1);

    // Clean up orphaned records referencing this member
    DB.records = DB.records.filter((record) => record.memberId !== memberId);

    saveToDatabase(DB);
  } catch (error) {
    throw {
      status: error?.status || 500,
      message: error?.message || error,
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
