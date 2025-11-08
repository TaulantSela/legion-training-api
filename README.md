# Legion Training API

Legion is an Express-based platform for gyms, coaches, and personal trainers to orchestrate daily programming, manage athletes, and track performance data. It started as a CrossFit WOD API and is evolving into a multi-tenant coaching backend.

## Features
- Workouts CRUD with rich filtering (mode, equipment, pagination, sorting) and role-guarded mutations
- Member management with duplicate checks, cascade delete, and coach/admin access control
- Record retrieval and full CRUD with validation, unique member/workout enforcement
- Authentication with JWTs, role-aware permissions (`coach`, `athlete`, `admin`)
- Swagger 3.0 docs exposed at `/api/v1/docs`
- Integration tests covering workouts, members, records, and utilities with Jest + Supertest
- Root introduction page with quick-start instructions at `/` (and `/api`)

## Environment
Create a `.env` file (or export env vars) to configure secrets. See `config/env.example` for a template.
```
JWT_SECRET=super-secret-value
JWT_EXPIRES_IN=2h
PORT=3000
```

Seed credentials (password: `password` for the examples below):
- coach@example.com (role: coach)
- athlete@example.com (role: athlete)

Run `npm install` before starting the server.

## Key Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register a user (returns JWT) |
| `/api/v1/auth/login` | POST | Authenticate user (returns JWT) |
| `/api/v1/healthz` | GET | API health check |
| `/api/v1/workouts/random` | GET | Random workout with optional filters |
| `/api/v1/workouts` | CRUD | Manage workouts (coach/admin for mutations) |
| `/api/v1/members` | CRUD | Manage members (coach/admin for mutations) |
| `/api/v1/records` | CRUD | Manage performance records |

All protected routes expect `Authorization: Bearer <token>` header.

## Roadmap
- Tenant-aware scheduling and habit tracking
- Nutrition modules and wearable integrations
- Messaging, leaderboards, and analytics dashboards

## Getting Started
```bash
npm install
npm run dev
# visit http://localhost:${PORT:-3000}/api/v1/docs for API documentation
```

Pull requests, ideas, and feature requests are welcome as Legion expands beyond workouts into a full coaching stack.
