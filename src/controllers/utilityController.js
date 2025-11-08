const workoutService = require("../services/workoutService");

const getRootOverview = (_req, res) => {
  res.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Legion Training API</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2.5rem auto; max-width: 720px; line-height: 1.6; color: #101828; }
      h1 { font-size: 2.25rem; margin-bottom: 0.25rem; }
      h2 { margin-top: 2rem; }
      code, pre { background: #f2f4f7; padding: 0.15rem 0.4rem; border-radius: 4px; }
      pre { padding: 0.9rem; overflow-x: auto; }
      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul { padding-left: 1.25rem; }
      footer { margin-top: 3rem; font-size: 0.9rem; color: #475467; }
    </style>
  </head>
  <body>
    <h1>Legion Training API</h1>
    <p>The Legion API powers multi-tenant training workflows for gyms, coaches, and athletes. Use the links and quick-start steps below to explore the service.</p>

    <h2>Quick Links</h2>
    <ul>
      <li><a href="/api/v1/docs">Swagger UI &amp; schema reference</a></li>
      <li><a href="/api/v1/healthz">Health check</a></li>
      <li><a href="/api/v1/workouts">List workouts</a></li>
      <li><a href="/api/v1/workouts/random">Random workout</a></li>
    </ul>

    <h2>Getting Started</h2>
    <ol>
      <li>Register or login to obtain a JWT token via <code>POST /api/v1/auth/register</code> or <code>POST /api/v1/auth/login</code>.</li>
      <li>Call any open endpoint (workout catalogue, records, members) without a token.</li>
      <li>Include <code>Authorization: Bearer &lt;token&gt;</code> for protected coach/admin actions (creating workouts, members, and records).</li>
    </ol>

    <h2>Test Credentials</h2>
    <pre><code>coach@example.com / password  (role: coach)
athlete@example.com / password (role: athlete)</code></pre>

    <h2>Example Requests</h2>
    <pre><code># Health check
curl https://$HOST/api/v1/healthz

# Login (returns JWT)
curl -X POST https://$HOST/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@example.com","password":"password"}'

# Authenticated create workout
curl -X POST https://$HOST/api/v1/workouts \
  -H "Authorization: Bearer &lt;token&gt;" \
  -H "Content-Type: application/json" \
  -d '{"name":"Legion Builder","mode":"AMRAP 12","equipment":["barbell"],"exercises":["12 thrusters","12 pull-ups"],"trainerTips":["Stay unbroken"]}'</code></pre>

    <footer>
      Tip: Replace <code>$HOST</code> with <code>${process.env.VERCEL_URL}</code> when copying the curl commands.
    </footer>
  </body>
</html>`);
};

const getHealth = (_req, res) => {
  res.send({ status: "OK", data: { service: "legion", healthy: true } });
};

const getRandomWorkout = (req, res) => {
  const { mode, equipment } = req.query;
  try {
    const workout = workoutService.getRandomWorkout({ mode, equipment });
    res.send({ status: "OK", data: workout });
  } catch (error) {
    res.status(error?.status || 500).send({
      status: "FAILED",
      data: { error: error?.message || error },
    });
  }
};

module.exports = {
  getRootOverview,
  getHealth,
  getRandomWorkout,
};
