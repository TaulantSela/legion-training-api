const authService = require("../services/authService");

const register = async (req, res) => {
  const { body } = req;
  try {
    const { user, token } = await authService.registerUser(body || {});
    res.status(201).send({ status: "OK", data: { user, token } });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

const login = async (req, res) => {
  const { body } = req;
  try {
    const { user, token } = await authService.loginUser(body || {});
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
