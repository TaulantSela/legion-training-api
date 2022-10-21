const express = require("express");
const membersController = require("../../controllers/memberController");

const router = express.Router();

router.get("/:memberId", membersController.getOneMember);

module.exports = router;
