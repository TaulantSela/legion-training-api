const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

// The landing page at / and /api. Examples use the host the visitor actually reached.
function landingPage({ host, protocol }) {
  const base = escapeHtml(`${protocol}://${host}`);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Legion Training API</title>
    <meta name="description" content="A multi-tenant REST API for gyms: workouts, members and results, with role-based access per gym." />
    <link rel="icon" href="/logo.svg" type="image/svg+xml" />
    <style>
      :root { color-scheme: light dark; --text: #101828; --muted: #475467; --bg: #ffffff; --code: #f2f4f7; --line: #e4e7ec; --accent: #ea580c; --link: #2563eb; }
      @media (prefers-color-scheme: dark) {
        :root { --text: #e4e7ec; --muted: #98a2b3; --bg: #0b1220; --code: #1d2939; --line: #344054; --accent: #fb923c; --link: #60a5fa; }
      }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 2.5rem 1rem 3rem; line-height: 1.6; color: var(--text); background: var(--bg); }
      main { max-width: 760px; margin: 0 auto; }
      header { display: flex; align-items: center; gap: 0.9rem; }
      header img { width: 52px; height: 52px; }
      h1 { font-size: 2rem; margin: 0; line-height: 1.2; }
      h2 { margin-top: 2.25rem; font-size: 1.25rem; }
      p.lead { color: var(--muted); font-size: 1.05rem; }
      code, pre { background: var(--code); border-radius: 6px; font-size: 0.875rem; }
      code { padding: 0.1rem 0.35rem; }
      pre { padding: 0.9rem 1rem; overflow-x: auto; }
      pre code { padding: 0; background: none; }
      a { color: var(--link); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .button { display: inline-block; background: var(--accent); color: #fff; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 600; }
      .button:hover { text-decoration: none; opacity: 0.9; }
      table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
      th, td { text-align: left; padding: 0.45rem 0.5rem; border-bottom: 1px solid var(--line); vertical-align: top; }
      ul, ol { padding-left: 1.25rem; }
      footer { margin-top: 3rem; font-size: 0.9rem; color: var(--muted); }
    </style>
  </head>
  <body>
    <main>
      <header>
        <img src="/logo.svg" alt="" />
        <h1>Legion Training API</h1>
      </header>
      <p class="lead">A multi-tenant REST API for gyms. Each gym keeps its own workouts, members and results, and every account has a role in exactly one gym.</p>
      <p><a class="button" href="/api/v1/docs">Open the interactive docs</a></p>

      <h2>Try it in a minute</h2>
      <ol>
        <li>In the docs, run <code>POST /api/v1/auth/login</code> with <code>coach@example.com</code> / <code>password</code>.</li>
        <li>Copy the <code>token</code>, press <strong>Authorize</strong> and paste it.</li>
        <li>Call <code>GET /api/v1/workouts</code>, add a member, record a result.</li>
      </ol>
      <p>Or skip the token and browse the demo gym's public catalogue: <a href="/api/v1/gyms/legion-demo/workouts">workouts</a>, <a href="/api/v1/gyms/legion-demo/workouts/random">a random one</a>.</p>

      <h2>Roles</h2>
      <table>
        <thead><tr><th>Role</th><th>Can</th><th>Demo login</th></tr></thead>
        <tbody>
          <tr><td>Admin</td><td>Everything a coach can, plus rename the gym, rotate the invite code and change roles</td><td>Open your own gym with <code>POST /auth/register-gym</code></td></tr>
          <tr><td>Coach</td><td>Manage workouts, members and results</td><td><code>coach@example.com</code> / <code>password</code></td></tr>
          <tr><td>Athlete</td><td>Read workouts and the leaderboard, log their own results</td><td><code>athlete@example.com</code> / <code>password</code>, or join with invite code <code>LEGION-DEMO</code></td></tr>
        </tbody>
      </table>
      <p>Roles come from the account, never from the request. Signing up either opens a new gym (you become its admin) or joins one with an invite code (you become an athlete).</p>

      <h2>Example</h2>
      <pre><code># Log in
curl -X POST ${base}/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"athlete@example.com","password":"password"}'

# Log your own result for a workout
curl -X PUT ${base}/api/v1/me/records/&lt;workoutId&gt; \\
  -H "Authorization: Bearer &lt;token&gt;" \\
  -H "Content-Type: application/json" \\
  -d '{"result":"8:15"}'</code></pre>

      <h2>Links</h2>
      <ul>
        <li><a href="/api/v1/docs">Interactive docs</a> and the <a href="/api/v1/docs.json">OpenAPI 3.1 spec</a></li>
        <li><a href="/api/v1/healthz">Health check</a></li>
        <li><a href="https://github.com/TaulantSela/legion-training-api">Source on GitHub</a></li>
      </ul>

      <footer>The demo gym is rebuilt every night at 03:00 UTC, and gyms you open are deleted after 7 days.</footer>
    </main>
  </body>
</html>`;
}

module.exports = { landingPage };
