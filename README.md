# Bhawani Fitness CRM

Premium wellness CRM/Admin system for Bhawani Fitness with a React + Vite CRM frontend, Node/Express TypeScript backend, MySQL/MariaDB, Prisma ORM, JWT auth, role-based panels, premium client access control, Flutter app APIs, audit logs, CSV exports, file uploads, and integration-ready services.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form, Zod, Recharts.
- Backend: Node.js, Express, TypeScript, MySQL/MariaDB, Prisma 7, JWT access/refresh tokens, bcrypt, Helmet, CORS, rate limiting, Multer.
- Integrations: Firebase Cloud Messaging, WhatsApp Business API, Razorpay, AI support escalation.

## Setup

```powershell
cd "C:\Users\vaibh\OneDrive\Desktop\bhawnani fitness crm\bhawani-crm"

# Use XAMPP MySQL/MariaDB, or optional Docker MySQL
# XAMPP default URL: mysql://root:@localhost:3306/bhawani_crm
# docker compose up -d

Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env

npm --prefix backend install
npm --prefix frontend install

npm --prefix backend run prisma:migrate -- --name init
npm --prefix backend run seed

npm --prefix backend run dev
npm --prefix frontend run dev
```

Frontend: `http://localhost:5173`
Backend health: `http://localhost:5000/health`

Seed Super Admin:

- Email: `admin@bhawanifitness.com`
- Password: `Admin@12345`

Other seed users:

- `sales@bhawanifitness.com` / `Sales@12345`
- `trainer@bhawanifitness.com` / `Trainer@12345`
- `dietician@bhawanifitness.com` / `Diet@12345`
- `support@bhawanifitness.com` / `Support@12345`
- `client@bhawanifitness.com` / `Client@12345`

## Database

The Prisma schema includes normalized models for users, clients, plans, subscriptions, payments, leads, onboarding calls, diet plans/meals/progress, yoga sessions/assignments/attendance/recordings, tickets, chat messages, notifications, feedback, activity logs, files, refresh tokens, and password reset tokens.

Main commands:

```powershell
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate -- --name init
npm --prefix backend run prisma:deploy
npm --prefix backend run seed
npm --prefix backend run prisma:studio
```

## CRM Routes

- `/login`
- `/super-admin/dashboard`, `/super-admin/users`, `/super-admin/clients`, `/super-admin/leads`, `/super-admin/subscriptions`, `/super-admin/payments`, `/super-admin/onboarding`, `/super-admin/diet-plans`, `/super-admin/yoga-sessions`, `/super-admin/recordings`, `/super-admin/support`, `/super-admin/analytics`, `/super-admin/activity-logs`
- `/sales/dashboard`, `/sales/leads`, `/sales/onboarding`, `/sales/clients`
- `/trainer/dashboard`, `/trainer/sessions`, `/trainer/clients`, `/trainer/attendance`, `/trainer/recordings`
- `/dietician/dashboard`, `/dietician/clients`, `/dietician/diet-plans`, `/dietician/progress`, `/dietician/chat`
- `/support/dashboard`, `/support/tickets`, `/support/chats`, `/support/history`

Every sidebar route opens a working data page. Major forms save to the backend. Lists support search, status filters, pagination, status badges, and CSV export.

## Auth API

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

CRM login accepts staff roles only. Client app login uses `/api/app/auth/login` and requires an active paid premium subscription.

## Flutter App API

- `POST /api/app/auth/login`
- `POST /api/app/auth/refresh`
- `GET /api/app/me`
- `GET /api/app/subscription/current`
- `GET /api/app/dashboard`
- `GET /api/app/diet-plan/current`
- `GET /api/app/diet-plan/meals`
- `GET /api/app/diet-progress`
- `POST /api/app/diet-feedback`
- `GET /api/app/yoga-sessions/upcoming`
- `GET /api/app/yoga-sessions/today`
- `POST /api/app/yoga-sessions/:id/join`
- `POST /api/app/yoga-sessions/:id/leave`
- `GET /api/app/yoga-sessions/recordings`
- `GET /api/app/notifications`
- `PATCH /api/app/notifications/:id/read`
- `GET /api/app/chat/messages`
- `POST /api/app/chat/message`
- `POST /api/app/support/ticket`
- `GET /api/app/support/tickets`
- `POST /api/app/feedback`

Premium checks return HTTP `402` with `PREMIUM_REQUIRED` when a client subscription is inactive or expired.

## CRM API

Generic resource endpoints:

- `GET /api/crm/:resource`
- `GET /api/crm/:resource/:id`
- `POST /api/crm/:resource`
- `PATCH /api/crm/:resource/:id`
- `DELETE /api/crm/:resource/:id`
- `GET /api/crm/reports/:resource.csv`

Resources:

`users`, `clients`, `leads`, `subscription-plans`, `subscriptions`, `payments`, `onboarding-calls`, `diet-plans`, `diet-meals`, `diet-progress`, `yoga-sessions`, `attendance`, `recordings`, `support-tickets`, `chat-messages`, `notifications`, `feedback`, `activity-logs`, `files`.

Special endpoints:

- `GET /api/crm/analytics/overview`
- `POST /api/crm/leads/:id/convert`
- `POST /api/crm/onboarding-calls/:id/remind`
- `POST /api/crm/payments/order`
- `POST /api/crm/payments/verify`
- `POST /api/crm/payments/webhook`
- `POST /api/crm/files/upload`

## RBAC

- `SUPER_ADMIN`: full CRM access.
- `SALES_ADMIN`: assigned leads, onboarding, assigned clients, conversions.
- `YOGA_TRAINER`: assigned clients, sessions, attendance, recordings.
- `DIETICIAN`: assigned clients, diet plans, progress, diet chat.
- `SUPPORT_ADMIN`: assigned tickets and chat history.
- `CLIENT`: app-only APIs and own premium data.

All sensitive mutations write activity logs. Password hashes are never returned.
