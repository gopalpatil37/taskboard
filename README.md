# TaskBoard

A task manager with a React/Vite client and a Hono API backed by PostgreSQL.

## Repository layout

- `client/` — React, TypeScript, and Vite application.
- `server/` — Hono API, database code, and PostgreSQL migrations.

## Run locally

Requirements: Node.js, npm, and PostgreSQL.

1. Create a PostgreSQL database named `taskboard`.
2. Configure and start the API:

   ```powershell
   cd server
   npm ci
   Copy-Item .env.example .env
   ```

   Update `server/.env` with your PostgreSQL credentials and a random `JWT_SECRET`
   of at least 16 characters. Then run:

   ```powershell
   npx tsx src/db/migrate.ts
   npm run dev
   ```

   The API runs at `http://localhost:3000`.

3. In a second terminal, configure and start the client:

   ```powershell
   cd client
   npm ci
   Copy-Item .env.example .env
   npm run dev
   ```

   Open `http://localhost:5173`. The client environment file points to the local
   API at `http://localhost:3000`.

The client and server environment templates list the required variables:
[`client/.env.example`](client/.env.example) and
[`server/.env.example`](server/.env.example). Keep the generated `.env` files
private; they are ignored by Git.

## Live demo and demo login

- Live URL: not currently configured in this repository.
- Demo login: no shared demo account is seeded. Create an account through the
  signup page when running locally.

Do not put demo passwords or other credentials in this repository.

## Implementation choices

- The client and API are kept in separate folders so each can be installed and
  run independently.
- Authentication uses a signed JWT in an HTTP-only cookie. Client JavaScript
  cannot read the token; the cookie is `SameSite=Lax`, secure in production, and
  expires after seven days.
- Passwords are hashed with bcrypt. Zod validates API input, and database
  ownership checks ensure users can only access their own projects and tasks.
- PostgreSQL schema changes are tracked as SQL migrations.

## Useful commands

From `client/`: `npm run lint` and `npm run build`.

From `server/`: `npm run dev` or `npm start`.

## With more time

I would add automated API and UI tests for authentication, ownership, and
validation, then set up continuous integration and a documented deployment with
a managed PostgreSQL database.
