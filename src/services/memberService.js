const { v4: uuid } = require("uuid");
const Member = require("../database/Member");

const getAllMembers = async (filters) => {
  try {
    const members = await Member.getAllMembers(filters);
    return members;
  } catch (error) {
    throw error;
  }
};

const getOneMember = async (memberId) => {
  try {
    const member = await Member.getOneMember(memberId);
    return member;
  } catch (error) {
    throw error;
  }
};

const createNewMember = async (newMember) => {
  const memberToInsert = {
    ...newMember,
    id: uuid(),
  };
  try {
    const createdMember = await Member.createNewMember(memberToInsert);
    return createdMember;
  } catch (error) {
    throw error;
  }
};

const updateOneMember = async (memberId, changes) => {
  try {
    const updatedMember = await Member.updateOneMember(memberId, changes);
    return updatedMember;
  } catch (error) {
    throw error;
  }
};

const deleteOneMember = async (memberId) => {
  try {
    await Member.deleteOneMember(memberId);
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
