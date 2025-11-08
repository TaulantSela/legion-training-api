const { app, initDocs } = require("../src/app");

const PORT = process.env.PORT || 3000;
let docsInitialized = false;

const ensureDocs = () => {
  if (!docsInitialized) {
    initDocs(PORT);
    docsInitialized = true;
  }
};

module.exports = (req, res) => {
  ensureDocs();
  return app(req, res);
};
