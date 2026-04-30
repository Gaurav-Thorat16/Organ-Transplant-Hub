# Organ Transplant Hub

A full-stack web application for organ availability discovery and transplant request coordination between hospitals and patients.

The project includes:
- Role-based authentication for hospital and patient users.
- Hospital organ inventory management.
- Patient search with blood-group compatibility filtering and urgency-aware ranking.
- Request lifecycle tracking (`PENDING`, `ACCEPTED`, `REJECTED`).
- Optional email and SMS notifications on request updates.
- Statistics dashboard for platform-level overview.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Wouter, TanStack Query, Tailwind CSS, Radix UI, Framer Motion
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL + Drizzle ORM
- Validation/Contracts: Zod shared schemas (`shared/`)
- Notifications (optional): Nodemailer (SMTP), Twilio

## Project Structure

```
client/                # React app (pages, hooks, UI components)
server/                # Express API, storage layer, notifications
shared/                # Shared API contracts and schemas (Zod + DB schema)
migrations/            # Drizzle SQL migrations
script/                # Build/migrate/reseed scripts
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Environment Variables

Create a `.env` file at the repository root.

Required:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

Recommended:

```env
PORT=5000
SESSION_SECRET=change-this-in-production
```

Optional notifications (if omitted, notification calls are safely skipped):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-password

TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_FROM=+10000000000
```

## Installation

```bash
npm install
```

## Database Setup

Run migrations:

```bash
npm run db:migrate
```

Optionally reseed demo data (clears users/hospitals/availability/requests and repopulates seed data):

```bash
npm run db:reseed
```

Alternative Drizzle commands:

```bash
npm run db:generate
npm run db:push
```

## Run the App

Development:

```bash
npm run dev
```

The app/API run on one server (default `http://localhost:5000`).

Production build:

```bash
npm run build
npm run start
```

Type-check:

```bash
npm run check
```

## Demo Credentials (Seed Data)

Hospital accounts (password: `Hospital123!`):
- `hospital.pune@transplant.local`
- `hospital.mumbai@transplant.local`
- `hospital.delhi@transplant.local`
- `hospital.bangalore@transplant.local`
- `hospital.chennai@transplant.local`
- `hospital.hyderabad@transplant.local`
- `hospital.kolkata@transplant.local`

Patient accounts (password: `Patient123!`):
- `patient.pune@transplant.local`
- `patient.mumbai@transplant.local`
- `patient.delhi@transplant.local`
- `patient.bangalore@transplant.local`
- `patient.chennai@transplant.local`
- `patient.hyderabad@transplant.local`

## Core Workflows

Hospital users can:
- View hospital profile.
- Add organ availability entries.
- Reduce quantity when an organ is allocated.
- View incoming patient requests.
- Accept or reject requests.

Patient users can:
- Search organ availability by city, organ type, and blood group.
- Enable compatibility mode to broaden donor matching by blood compatibility.
- Submit transplant requests with urgency and optional notes.
- Track request status in "My Requests".

All authenticated users can:
- View aggregate platform statistics.

## API Overview

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Hospitals:
- `GET /api/hospitals/mine`
- `GET /api/hospitals/availability`
- `POST /api/hospitals/availability`
- `DELETE /api/hospitals/availability/:availabilityId`
- `POST /api/hospitals/availability/:availabilityId/reduce`

Patients:
- `POST /api/patients/search`

Requests:
- `POST /api/requests`
- `GET /api/requests/mine`
- `GET /api/requests/incoming`
- `POST /api/requests/:requestId/status`

Stats:
- `GET /api/stats`

Request/response contracts are defined in:
- `shared/routes.ts`
- `shared/schema.ts`

## Security Notes

- Sessions are cookie-based via `express-session`.
- Passwords are stored as salted SHA-256 hashes.
- Default dev `SESSION_SECRET` should be replaced in production.

## License

MIT
