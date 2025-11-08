// In src/v1/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Basic Meta Informations about our API
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Legion Training Platform",
      version: "1.0.0",
      description:
        "Legion is a multi-tenant training platform for gyms and coaches to orchestrate workouts, track progress, and manage athletes.",
    },
  },
  apis: ["./src/v1/routes/*.js", "./src/database/*.js"],
};

// Docs in JSON format
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
const swaggerDocs = (app, port) => {
  // Route-Handler to visit our docs
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // Make our docs in JSON format available
  app.get("/api/v1/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  console.log(
    `Legion API docs are available at http://localhost:${port}/api/v1/docs`
  );
};

module.exports = { swaggerDocs };
