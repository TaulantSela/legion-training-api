// Local server. On Vercel, api/index.js exports the app instead.
const { app } = require("./app");
const { port } = require("./config");

app.listen(port, () => {
  console.log(`Legion API on http://localhost:${port} (docs at /api/v1/docs)`);
});
