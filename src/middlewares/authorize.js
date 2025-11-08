const authorize = (allowedRoles = []) => {
  if (!Array.isArray(allowedRoles)) {
    throw new Error("authorize middleware expects an array of roles");
  }

  return (req, res, next) => {
    const { user } = req;

    if (!user || !user.role) {
      res.status(403).send({
        status: "FAILED",
        data: { error: "You do not have permission to perform this action" },
      });
      return;
    }

    if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
      next();
      return;
    }

    res.status(403).send({
      status: "FAILED",
      data: { error: "You do not have permission to perform this action" },
    });
  };
};

module.exports = authorize;
