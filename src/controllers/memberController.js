const memberService = require("../services/memberService");

const getOneMember = (req, res) => {
  const {
    params: { memberId },
  } = req;
  if (!memberId) {
    res.status(400).send({
      status: "FAILED",
      data: { error: "Parameter ':memberId' can not be empty" },
    });
  }
  try {
    const member = memberService.getOneMember(memberId);
    res.send({ status: "OK", data: member });
  } catch (error) {
    res.send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

module.exports = { getOneMember };
