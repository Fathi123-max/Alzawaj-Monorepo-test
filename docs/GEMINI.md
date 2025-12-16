# Alzawaj Project

This is a full-stack web application for an Islamic marriage platform. The project is divided into a backend and a frontend, with a database and a caching layer.

## Project Overview

*   **Project Purpose:** An Islamic marriage platform with a focus on privacy, moderation, and cultural sensitivity.
*   **Technologies:**
    *   **Backend:** Node.js, Express, TypeScript, MongoDB (with Mongoose), Redis, Socket.IO
    *   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Socket.IO
*   **Architecture:**
    *   A monolithic backend API server.
    *   A server-side rendered (SSR) frontend application.
    *   A MongoDB database for data persistence.
    *   A Redis instance for caching and rate limiting.
    *   Real-time communication with Socket.IO.

## Building and Running

The project can be run using Docker Compose, which is the recommended way to run the application for development and production.

### Using Docker Compose (Recommended)

1.  **Prerequisites:**
    *   Docker
    *   Docker Compose

2.  **Environment Variables:**
    *   Create a `.env` file in the root of the project and add the necessary environment variables defined in the `docker-compose.yaml` file. You can use `frontend-env-template.txt` and `backend-env-template.txt` as a starting point.

3.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```
    This will build the Docker images for the frontend and backend and start all the services.

*   The frontend will be available at [http://localhost:3000](http://localhost:3000).
*   The backend will be available at [http://localhost:5000](http://localhost:5000).

### Running Manually

You can also run the frontend and backend services manually.

**Backend**

```bash
cd alzawaj-project-backend
pnpm install
pnpm run dev
```

**Frontend**

```bash
cd alzawaj-project-frontend
pnpm install
pnpm run dev
```

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for code linting and formatting. There are pre-commit hooks configured with Husky to enforce these standards.
*   **Testing:**
    *   **Backend:** Unit and integration tests are written with Jest. Run tests with `pnpm test`.
    *   **Frontend:** Unit tests are written with Jest and end-to-end tests with Playwright. Run tests with `pnpm test` and `pnpm test:e2e`.
*   **API Documentation:** The backend uses Swagger for API documentation, which should be available at `/api-docs` when the server is running.
