// In src/v1/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");

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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/v1/routes/*.js", "./src/database/*.js"],
};

// Docs in JSON format
const swaggerSpec = swaggerJSDoc(options);

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Legion Training Platform</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '/api/v1/docs.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>`;

// Function to setup our docs
const swaggerDocs = (app, port) => {
  app.get("/api/v1/docs", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(swaggerHtml);
  });

  // Keep legacy JSON endpoint
  app.get("/api/v1/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(
    `Legion API docs are available at http://localhost:${port}/api/v1/docs`
  );
};

module.exports = { swaggerDocs };
