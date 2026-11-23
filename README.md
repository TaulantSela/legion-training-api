# 🏋️ Legion Training API

A multi-tenant REST API for gyms. Each gym keeps its own workouts, members and
results, and every account has a role (admin, coach or athlete) in exactly
one gym. It's the backend for a coaching app: coaches program workouts and
record results, athletes read the gym's board and log their own.

**▶ [Open the interactive docs →](https://legion-training-api.vercel.app/api/v1/docs)**
— log in as the demo coach and call every endpoint from your browser.

Tenancy is enforced twice: every query is scoped to the signed-in user's gym,
and Postgres itself rejects a record that mixes gyms, so a bug in application
code can't leak one gym's data into another.

## Features

- **Per-gym tenancy.** A gym is a tenant. Workouts, members and records
  belong to one gym, and another gym's ids return 404.
- **Database-level guard.** A record references its member and workout by
  `(id, organizationId)`, so Postgres rejects a record that mixes gyms even
  if application code got it wrong.
- **Roles from the account, never the request.** Opening a gym makes you its
  admin; joining with an invite code makes you an athlete. Request bodies are
  strict, so sending `role` on sign-up is a 400.
- **Invite codes.** Athletes join with their gym's code. Admins rotate it,
  coaches and admins can see it, athletes can't. If a coach already added you
  as a member with the same email, your new login is linked to that profile.
- **Workouts.** Filter by `mode` and `equipment`, `sort`, paginate with
  `page` and `limit`, or ask for a random one.
- **Results.** One result per member and workout. Everyone in the gym can
  read them; athletes log their own, and logging again replaces the result.
- **Public catalogue.** A gym can opt in to publishing its workouts at
  `/api/v1/gyms/{slug}/workouts`, readable without an account.
- **Consistent JSON.** Every response uses the same envelope, including 404s
  and malformed JSON, and validation errors list every bad field.
- **Self-resetting demo.** The demo gym is rebuilt every night at 03:00 UTC,
  and gyms that visitors open are deleted after 7 days.
- **OpenAPI 3.1 spec** at `/api/v1/docs.json`, rendered with Swagger UI at
  `/api/v1/docs`.

| Role    | Can |
| ------- | --- |
| Admin   | Everything a coach can, plus rename the gym, publish its catalogue, rotate the invite code and change roles |
| Coach   | Create and edit workouts, members and records |
| Athlete | Read workouts and the gym's records, and log their own results |

## Use

### In the browser

1. Open the [docs](https://legion-training-api.vercel.app/api/v1/docs) and
   run `POST /api/v1/auth/login` with `coach@example.com` / `password`.
2. Copy the `token`, press **Authorize** and paste it.
3. List workouts, add a member, record a result.

Log in as `athlete@example.com` / `password` to see what athletes can do. To
try the admin features, open your own gym with `POST /api/v1/auth/register-gym`.

### With curl

The demo gym's catalogue is public:

```bash
curl "https://legion-training-api.vercel.app/api/v1/gyms/legion-demo/workouts?equipment=barbell&limit=2"
```

```json
{
  "status": "OK",
  "data": [
    { "name": "Core Buster", "mode": "AMRAP 20", "equipment": ["rack", "barbell", "abmat"], "…": "…" },
    { "name": "Dead Push-Ups", "mode": "AMRAP 10", "equipment": ["barbell"], "…": "…" }
  ],
  "meta": { "page": 1, "limit": 2, "total": 4 }
}
```

Everything else needs a token (this uses `jq` to pull it out):

```bash
API=https://legion-training-api.vercel.app/api/v1
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"coach@example.com","password":"password"}' | jq -r .data.token)

curl -H "Authorization: Bearer $TOKEN" "$API/members"
```

## Endpoints

| Endpoint | Who | What |
| --- | --- | --- |
| `POST /api/v1/auth/register-gym` | Anyone | Open a gym and become its admin |
| `POST /api/v1/auth/register` | Anyone | Join a gym as an athlete with its invite code |
| `POST /api/v1/auth/login` | Anyone | Get a token |
| `GET /api/v1/me` | Signed in | You, your gym and your member profile |
| `GET /api/v1/me/records` | Signed in | Your results |
| `PUT /api/v1/me/records/{workoutId}` | Signed in | Log your result for a workout (again replaces it) |
| `GET, PATCH /api/v1/gym` | Admin to change | Your gym; coaches and admins also see the invite code |
| `POST /api/v1/gym/invite-code` | Admin | Replace the invite code |
| `GET /api/v1/users`, `PATCH /users/{id}` | Admin | Your gym's logins, and changing their roles |
| `/api/v1/workouts` (CRUD, `/random`, `/{id}/records`) | All read, staff write | Filter by `mode` and `equipment`, `sort`, `page`, `limit` |
| `/api/v1/members` (CRUD, `/{id}/records`) | Staff | Athlete profiles. No passwords: logins are separate |
| `/api/v1/records` (CRUD) | All read, staff write | One result per member and workout |
| `GET /api/v1/gyms/{slug}`, `/workouts`, `/workouts/random` | Anyone | A gym's public catalogue, if it opted in (try `legion-demo`) |
| `GET /api/v1/healthz` | Anyone | Health check, including the database |

Responses are `{ "status": "OK", "data": …, "meta"?: … }` (`meta` carries
`page`, `limit` and `total` on workout lists) or
`{ "status": "FAILED", "data": { "error": "…", "details"?: […] } }`. Deletes
return `204` with no body.

## How it works

1. **Express 5** serves the API. On Vercel, `vercel.json` routes every request
   to `api/index.js`, which exports the app; locally `src/index.js` listens on
   a port.
2. Each route parses its input with a strict **zod** schema, then calls a
   service in `src/services/`, which talks to Postgres through **Prisma 6**.
3. `authenticate` verifies the JWT, which carries only the user id, and reads
   the user's role and gym from the database on every request, so a role
   change applies at once. `requireRole` guards staff and admin routes.
4. Services take the gym from the signed-in user, never from the request, and
   every query filters on it. Updates and deletes go through the compound
   `(id, organizationId)` key.
5. Errors leave as JSON in the same envelope. Known Prisma errors map to 404,
   409 or 400; anything else is logged and returned as a generic 500.
6. A **Vercel Cron** job calls `/api/v1/internal/reset-demo` nightly with
   `CRON_SECRET` as a bearer token. It rebuilds the demo gym from
   `src/demo/data.js` and prunes visitor gyms older than 7 days.

There's no cache layer: every request reads Postgres directly. Passwords are
hashed with bcrypt, and sign-up (10 an hour) and login (30 per 15 minutes)
are rate-limited per IP. That limit lives in memory on each instance, so on
serverless it's a speed bump, not a hard quota.

**Stack:** Node 22, Express 5, Prisma 6 with Postgres (Neon in production),
zod, JWT with bcrypt, an OpenAPI 3.1 spec with Swagger UI, and Jest with
Supertest. Deployed on Vercel.

## Run locally

Needs Node 22 or later.

```bash
npm install
cp .env.example .env
npx prisma dev --name legion --detach        # a local Postgres; put its TCP URL in DATABASE_URL
npx prisma dev --name legion-test --detach   # a second one for TEST_DATABASE_URL
npm run db:migrate
npm run db:seed                              # the demo gym and logins
npm run dev                                  # http://localhost:3000
```

Any Postgres works in place of `prisma dev`. With `prisma dev`, keep
`connection_limit=1&pgbouncer=true` in the URLs.

| Variable | |
| --- | --- |
| `DATABASE_URL` | Postgres for the app |
| `TEST_DATABASE_URL` | A separate, throwaway database for `npm test` |
| `JWT_SECRET` | Signs login tokens. Required: the app won't start without it |
| `JWT_EXPIRES_IN` | Token lifetime, default `1h` |
| `CRON_SECRET` | Unlocks the nightly demo reset. Leave it unset to disable the endpoint |
| `PORT` | Local port, default `3000` |

Schema changes go through Prisma migrations in `prisma/migrations`, applied
with `npm run db:migrate`.

## Tests

```bash
npm test
```

There are 109 integration tests that run against a real Postgres through the
HTTP API with Supertest. They cover:

- tenant isolation on every read and write
- what each role can and can't do
- sign-up, login, rate limiting and the nightly reset
- that every operation in the OpenAPI spec exists as a route

The tests delete everything in `TEST_DATABASE_URL` and refuse to run unless it
points at localhost or CI. GitHub Actions applies every migration to a fresh
Postgres 17 and runs them on each push to `main` and on every pull request.
