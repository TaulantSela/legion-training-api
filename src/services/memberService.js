const { v4: uuid } = require("uuid");
const Member = require("../database/Member");

const getAllMembers = (filters) => {
  try {
    const members = Member.getAllMembers(filters);
    return members;
  } catch (error) {
    throw error;
  }
};

const getOneMember = (memberId) => {
  try {
    const member = Member.getOneMember(memberId);
    return member;
  } catch (error) {
    throw error;
  }
};

const createNewMember = (newMember) => {
  const memberToInsert = {
    ...newMember,
    id: uuid(),
  };
  try {
    const createdMember = Member.createNewMember(memberToInsert);
    return createdMember;
  } catch (error) {
    throw error;
  }
};

const updateOneMember = (memberId, changes) => {
  try {
    const updatedMember = Member.updateOneMember(memberId, changes);
    return updatedMember;
  } catch (error) {
    throw error;
  }
};

const deleteOneMember = (memberId) => {
  try {
    Member.deleteOneMember(memberId);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllMembers,
  getOneMember,
  createNewMember,
  updateOneMember,
  deleteOneMember,
};
