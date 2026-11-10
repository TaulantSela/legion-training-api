// Every success looks like { status: "OK", data, meta? }
const ok = (res, data, { status = 200, meta } = {}) =>
  res.status(status).json(meta ? { status: "OK", data, meta } : { status: "OK", data });

module.exports = { ok };
