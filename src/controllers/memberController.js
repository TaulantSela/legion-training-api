const memberService = require("../services/memberService");

const getAllMembers = async (req, res) => {
  const { gender, email } = req.query;
  try {
    const members = await memberService.getAllMembers({ gender, email });
    res.send({ status: "OK", data: members });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const getOneMember = async (req, res) => {
  const {
    params: { memberId },
  } = req;
  if (!memberId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':memberId' can not be empty" },
    });
    return;
  }
  try {
    const member = await memberService.getOneMember(memberId);
    res.send({ status: "OK", data: member });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const createNewMember = async (req, res) => {
  const { body } = req;
  if (!body.name || !body.gender || !body.dateOfBirth || !body.email) {
    res.status(400).send({
      status: "FAILED",
      data: {
        error:
          "One of the following keys is missing or is empty in request body: 'name', 'gender', 'dateOfBirth', 'email'",
      },
    });
    return;
  }
  try {
    const createdMember = await memberService.createNewMember({
      name: body.name,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      email: body.email,
      password: body.password || "",
    });
    res.status(201).send({ status: "OK", data: createdMember });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const updateOneMember = async (req, res) => {
  const {
    params: { memberId },
    body,
  } = req;
  if (!memberId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':memberId' can not be empty" },
    });
    return;
  }
  if (Object.keys(body || {}).length === 0) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Request body can not be empty" },
    });
    return;
  }
  try {
    const updatedMember = await memberService.updateOneMember(memberId, body);
    res.send({ status: "OK", data: updatedMember });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const deleteOneMember = async (req, res) => {
  const {
    params: { memberId },
  } = req;
  if (!memberId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':memberId' can not be empty" },
    });
    return;
  }
  try {
    await memberService.deleteOneMember(memberId);
    res.status(204).send();
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

module.exports = {
  getAllMembers,
  getOneMember,
  createNewMember,
  updateOneMember,
  deleteOneMember,
};
