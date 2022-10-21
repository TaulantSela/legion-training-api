const DB = require("./db.json");

const getOneMember = (memberId) => {
  try {
    const member = DB.members.filter((member) => member.id === memberId);

    if (!member) {
      throw {
        status: 400,
        message: `Can't find member with the id: '${memberId}'`,
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

module.exports = { getOneMember };
