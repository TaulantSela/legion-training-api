const SWAGGER_UI = "https://unpkg.com/swagger-ui-dist@5.32.0";

const docsPage = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Legion Training API docs</title>
    <link rel="icon" href="/logo.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api/v1/docs.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          persistAuthorization: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>`;

module.exports = { docsPage };
