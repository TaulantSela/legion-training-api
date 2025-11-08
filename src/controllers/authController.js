const authService = require("../services/authService");

const register = (req, res) => {
  const { body } = req;
  try {
    const { user, token } = authService.registerUser(body || {});
    res.status(201).send({ status: "OK", data: { user, token } });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const login = (req, res) => {
  const { body } = req;
  try {
    const { user, token } = authService.loginUser(body || {});
    res.send({ status: "OK", data: { user, token } });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

module.exports = {
  register,
  login,
};
