# GEMINI.md - Context & Instructions for Islamic Zawaj Platform

## Project Overview
**Islamic Zawaj Platform** is a comprehensive full-stack web application designed for Islamic marriage services, prioritizing privacy, moderation, and cultural sensitivity. It operates as a monorepo containing a Node.js/Express backend and a Next.js frontend.

### Tech Stack
*   **Frontend (`alzawaj-project-frontend`):** Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS (RTL support), React Query, Radix UI, Firebase.
*   **Backend (`alzawaj-project-backend`):** Node.js, Express, MongoDB (Mongoose), TypeScript, Redis, Socket.io, JWT Authentication.
*   **Infrastructure:** Docker, Docker Compose, PM2.
*   **Package Manager:** pnpm.

## Directory Structure
```
/
├── alzawaj-project-backend/    # Express API
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API definition
│   │   ├── services/           # Business logic
│   │   └── middleware/         # Auth, validation, rate-limiting
├── alzawaj-project-frontend/   # Next.js Application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utils, API clients, hooks
│   └── public/                 # Static assets (RTL aware)
├── .clinerules/                # Project Coding Standards
└── [Root Scripts]              # Docker and Environment helpers
```

## Development Workflow

### Prerequisites
*   Node.js (>=20.x Backend, >=18.x Frontend)
*   pnpm (>=8.0.0)
*   Docker & Docker Compose

### Building & Running
**Option 1: Docker (Recommended for Full Stack)**
Use the provided root scripts to manage the environment and containers:
```bash
# Start the local environment with Docker Compose
./load-env-and-run-docker.sh
```

**Option 2: Manual (Individual Services)**
1.  **Backend:**
    ```bash
    cd alzawaj-project-backend
    pnpm install
    pnpm run dev      # Starts nodemon on src/server.ts
    ```
2.  **Frontend:**
    ```bash
    cd alzawaj-project-frontend
    pnpm install
    pnpm run dev      # Starts Next.js dev server
    ```

### Testing
*   **Backend:** `pnpm test` (Jest), `pnpm run comprehensive-test` (Custom scripts).
*   **Frontend:** `pnpm test` (Jest), `pnpm run test:e2e` (Playwright).

## Coding Conventions & Style
**Reference:** `.clinerules/CODE_STYLE_GUIDE.md`

### Core Principles
1.  **Islamic Values:** Ensure all features respect privacy, modesty, and gender segregation. Content must be culturally sensitive.
2.  **Type Safety:** Strict TypeScript usage. No `any`. Define interfaces for all data structures (DTOs, Props, Models).
3.  **Internationalization:** Primary support for Arabic (RTL). Ensure UI components handle RTL layouts correctly (`dir="rtl"`).

### Architecture Patterns
*   **Backend:** Controller -> Service -> Model. Business logic resides in `services/`.
*   **Frontend:**
    *   Use **React Query** for server state.
    *   Use **Zod** for schema validation.
    *   Use **Tailwind CSS** for styling (utility-first).
    *   **Components:** Functional, typed props, small and focused.

### Git & Code Quality
*   **Commits:** Clear, descriptive messages.
*   **Formatting:** Prettier is enforced.
*   **Linting:** ESLint standard must be passed before committing.

## Key Files
*   `alzawaj-project-backend/src/server.ts`: Backend entry point.
*   `alzawaj-project-frontend/app/layout.tsx`: Root layout (providers, global styles).
*   `docker-compose.local.yaml`: Local development services definition.
*   `.clinerules/CODE_STYLE_GUIDE.md`: Detailed style guide.
