# Velverse AI + TaskFlow — Unified Platform v4.0

A complete, deployment-ready full-stack platform combining:
- **Velverse AI** — 5 autonomous AI squads (Software Dev, Web Dev, UI/UX, Marketing, Data Analysis)
- **TaskFlow** — Full kanban task management (Projects + Tasks + Priorities + Due Dates)
- **Auth** — JWT + Google OAuth 2.0
- **Payments** — Razorpay (UPI, BHIM, PhonePe, NetBanking)
- **ZIP Export** — Download AI session code as structured project files

---

## Quick Start (3 Steps)

### Step 1 — Install
```bash
npm run install:all
```

### Step 2 — Configure
```bash
cd backend  && cp .env.example .env   # set MONGO_URI, JWT_SECRET, REFRESH_SECRET
cd frontend && cp .env.example .env   # VITE_API_URL already set for local dev
```

### Step 3 — Run
```bash
npm run dev    # frontend :3000 + backend :5000
```

---

## What Was Added (TaskFlow Integration)

### New Backend
- `models/Project.js` — color-coded projects with owner scoping
- `models/Task.js` — kanban tasks with status, priority, labels, due date
- `controllers/projectController.js` — full CRUD, cascades task delete
- `controllers/taskController.js` — full CRUD + status patch + filtering
- `routes/projectRoutes.js` — /api/projects/*
- `routes/taskRoutes.js` — /api/tasks/* with validation

### New Frontend
- `pages/Tasks.jsx` — full kanban board with project sidebar
- `components/TaskCard.jsx` — dark-theme task card with priority/due/labels
- `components/TaskModal.jsx` — dark-theme create/edit modal
- `hooks/useProjects.js` — project CRUD hooks
- `hooks/useTasks.js` — task CRUD hooks
- `api/api.js` — added projectAPI + taskAPI exports

### Updated
- `App.jsx` — added /tasks route
- `Dashboard.jsx` — shows TaskFlow stats + project progress bars
- `Navbar.jsx` — added Task Board link
- `server.js` — registers /api/projects + /api/tasks
- `package.json` — v4.0.0, added cookie-parser

---

## All 26 API Endpoints

| Module | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Auth | POST | /api/auth/register | - |
| Auth | POST | /api/auth/login | - |
| Auth | POST | /api/auth/logout | JWT |
| Auth | GET  | /api/auth/me | JWT |
| User | GET  | /api/user/profile | JWT |
| User | PUT  | /api/user/profile | JWT |
| User | PUT  | /api/user/change-password | JWT |
| Payment | POST | /api/payment/razorpay/create-order | JWT |
| Payment | POST | /api/payment/razorpay/verify | JWT |
| Payment | GET  | /api/payment/history | JWT |
| AI | POST | /api/ai/chat | JWT |
| AI | GET  | /api/ai/history | JWT |
| AI | GET  | /api/ai/agents | JWT |
| ZIP | GET  | /api/zip/preview | JWT |
| ZIP | POST | /api/zip/generate | JWT |
| Services | GET | /api/services | - |
| Projects | GET    | /api/projects | JWT |
| Projects | POST   | /api/projects | JWT |
| Projects | GET    | /api/projects/:id | JWT |
| Projects | PUT    | /api/projects/:id | JWT |
| Projects | DELETE | /api/projects/:id | JWT |
| Tasks | GET    | /api/tasks | JWT |
| Tasks | POST   | /api/tasks | JWT |
| Tasks | GET    | /api/tasks/:id | JWT |
| Tasks | PUT    | /api/tasks/:id | JWT |
| Tasks | PATCH  | /api/tasks/:id/status | JWT |
| Tasks | DELETE | /api/tasks/:id | JWT |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| HTTP Client | Axios (JWT interceptor) |
| Routing | React Router DOM v6 |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt + Google OAuth |
| Payments | Razorpay (INR native) |
| AI Engine | Flowise AI (5 endpoints) |
| Security | Helmet + rate-limit |

---

*Velverse AI + TaskFlow v4.0 — SCET CSE Final Year 2025-26*
