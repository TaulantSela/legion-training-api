# Legion Training API

A multi-tenant REST API for gyms. Each gym keeps its own workouts, members and results, and every account has a role in exactly one gym.

**Live:** [legion-training-api.vercel.app](https://legion-training-api.vercel.app) · **Docs:** [/api/v1/docs](https://legion-training-api.vercel.app/api/v1/docs)

## Try it

1. Open the [docs](https://legion-training-api.vercel.app/api/v1/docs) and run `POST /api/v1/auth/login` with `coach@example.com` / `password`.
2. Copy the `token`, press **Authorize** and paste it.
3. List workouts, add a member, record a result.

Log in as `athlete@example.com` / `password` to see what athletes can do. To try the admin features, open your own gym with `POST /api/v1/auth/register-gym`.

The demo gym is rebuilt every night at 03:00 UTC, and gyms that visitors open are deleted after 7 days.

## How tenancy works

- **A gym is a tenant.** Workouts, members and records belong to one gym, and every query is scoped to the signed-in user's gym. Another gym's ids return 404.
- **The database enforces it too.** A record references its member and workout by `(id, organizationId)`, so Postgres rejects a record that mixes gyms even if application code got it wrong.
- **Roles come from the account, never the request.** Signing up either opens a new gym, making you its admin, or joins one with an invite code, making you an athlete. Sending `role` on sign-up is a 400.
- **Tokens carry only the user id.** Role and gym are read on every request, so a role change applies at once.

| Role    | Can                                                                                       |
| ------- | ----------------------------------------------------------------------------------------- |
| Admin   | Everything a coach can, plus rename the gym, publish its catalogue, rotate the invite code and change roles |
| Coach   | Create and edit workouts, members and records                                             |
| Athlete | Read workouts and the gym's records, and log their own results                            |

## Endpoints

| Endpoint                                   | Who       | What                                                        |
| ------------------------------------------ | --------- | ----------------------------------------------------------- |
| `POST /api/v1/auth/register-gym`           | Anyone    | Open a gym and become its admin                             |
| `POST /api/v1/auth/register`               | Anyone    | Join a gym as an athlete with its invite code               |
| `POST /api/v1/auth/login`                  | Anyone    | Get a token                                                 |
| `GET /api/v1/me`                           | Signed in | You, your gym and your member profile                       |
| `GET /api/v1/me/records`                   | Signed in | Your results                                                |
| `PUT /api/v1/me/records/{workoutId}`       | Signed in | Log your result for a workout (again replaces it)           |
| `GET, PATCH /api/v1/gym`                   | Admin to change | Your gym; coaches and admins also see the invite code |
| `POST /api/v1/gym/invite-code`             | Admin     | Replace the invite code                                     |
| `GET /api/v1/users`, `PATCH /users/{id}`   | Admin     | Your gym's logins, and changing their roles                 |
| `/api/v1/workouts` (CRUD, `/random`, `/{id}/records`) | All read, staff write | Filter by `mode` and `equipment`, `sort`, `page`, `limit` |
| `/api/v1/members` (CRUD, `/{id}/records`)  | Staff     | Athlete profiles. No passwords: logins are separate         |
| `/api/v1/records` (CRUD)                   | All read, staff write | One result per member and workout               |
| `GET /api/v1/gyms/{slug}/workouts`         | Anyone    | A gym's public catalogue, if it opted in (try `legion-demo`) |
| `GET /api/v1/healthz`                      | Anyone    | Health check, including the database                        |

Every response is `{ "status": "OK", "data": … }` or `{ "status": "FAILED", "data": { "error": "…", "details"?: […] } }`, including 404s and malformed JSON.

## Run it locally

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

Any Postgres works in place of `prisma dev`. With `prisma dev`, keep `connection_limit=1&pgbouncer=true` in the URLs.

## Tests

```bash
npm test
```

There are 109 integration tests that run against a real Postgres through the HTTP API with Supertest. They cover:

- tenant isolation on every read and write
- what each role can and can't do
- sign-up, login, rate limiting and the nightly reset
- that every operation in the OpenAPI spec exists as a route

The tests delete everything in `TEST_DATABASE_URL` and refuse to run unless it points at localhost or CI. GitHub Actions runs them against Postgres 17 on every push and pull request.

## Stack

Node 22, Express 5, Prisma 6 with Postgres (Neon in production), zod for validation, JWT with bcrypt, an OpenAPI 3.1 spec with Swagger UI, and Jest with Supertest. It's deployed on Vercel, where a Vercel Cron rebuilds the demo nightly.

Schema changes go through Prisma migrations in `prisma/migrations`, applied with `npm run db:migrate`.
