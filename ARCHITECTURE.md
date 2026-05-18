# PulseAlign Architecture

## Overview
PulseAlign is a Next.js 15 app using server-side rendering, Clerk authentication, Prisma with PostgreSQL, and a feature-sliced UI. The app is organized around role-based dashboards, REST-style route handlers, and reusable UI components.

## Repository & Deployment

- GitHub repo: https://github.com/gracy-devatharshni/Pulse-Align
- Hosted app: https://pulsetracker-bice.vercel.app

## Core Layers

- **Frontend / UI**: `src/app`, `src/components`, `src/store`
- **API / Business Logic**: `src/app/api` route handlers
- **Database / ORM**: `src/lib/db.ts`, `prisma/schema.prisma`
- **Authentication**: Clerk via `@clerk/nextjs`
- **Utilities**: `src/lib/auth.ts`, `src/lib/validations.ts`

## Architectural Diagram

```mermaid
flowchart LR
  subgraph Client
    Browser[Browser / User]
    UI[Next.js App Router UI]
  end

  subgraph Frontend
    App[app/ pages + layouts]
    Components[components/*]
    Store[Zustand store]
  end

  subgraph Server
    API[Route Handlers (src/app/api/*)]
    Auth[Clerk auth + middleware]
    Utils[lib/auth.ts<br>lib/validations.ts]
  end

  subgraph Data
    Prisma[Prisma Client]
    DB[PostgreSQL Database]
  end

  Browser --> UI
  UI --> App
  App --> Components
  App --> Store
  App --> API
  App --> Auth
  API --> Utils
  API --> Prisma
  Auth --> Prisma
  Prisma --> DB
  DB --> Prisma

  note right of API
    Managers, admins, employees
    access role-protected
    route handlers for goals,
    approvals, analytics
  end

  note right of DB
    Users, Goals, Cycles,
    CheckIns, AuditLogs,
    Notifications
  end
```

## Key Functional Areas

- **Dashboard**: protected `src/app/(dashboard)` routes and layouts
- **Goals**: goal creation, submission, approval, and locking
- **Approvals**: manager review workflows
- **Analytics**: aggregated reporting endpoints
- **Audit**: immutable change history and review pages
- **Shared Goals**: cascading objectives and manager-to-employee goal linking

## Notes

- `src/lib/db.ts` initializes Prisma with PostgreSQL connection pooling.
- `src/app/api` contains route handlers for backend operations used by the client.
- Role-based access exists at both the UI route and API route levels.
- The Mermaid diagram can be rendered in tools that support Mermaid inside Markdown.
