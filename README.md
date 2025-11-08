# Legion Training API

Legion is an Express-based platform for gyms, coaches, and personal trainers to orchestrate daily programming, manage athletes, and track performance data. It started as a CrossFit WOD API and is evolving into a multi-tenant coaching backend.

## Features
- Workouts CRUD with rich filtering (mode, equipment, pagination, sorting)
- Member management with duplicate checks and cascade delete
- Record retrieval per workout and foundation for broader performance tracking
- Swagger 3.0 docs exposed at `/api/v1/docs`
- Integration tests covering core flows with Jest + Supertest

## Roadmap
- Record creation/update/delete with validation
- Tenant-aware scheduling and habit tracking
- Nutrition modules and wearable integrations
- Messaging, leaderboards, and analytics dashboards

## Getting Started
```bash
npm install
npm run dev
# visit http://localhost:3000/api/v1/docs for API documentation
```

Pull requests, ideas, and feature requests are welcome as Legion expands beyond workouts into a full coaching stack.
