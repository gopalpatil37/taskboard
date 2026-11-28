# TaskBoard

**Full-Stack Project and Task Management Application**

TaskBoard is a web application that allows users to create projects, organize tasks, track progress, set priorities, and manage their work through a responsive interface.

## 1. Features

- **Authentication:** User registration, login and logout.
- **Project Management:** Create, view, rename and delete projects.
- **Task Management:** Create, edit and delete tasks.
- **Task Status:** Track tasks as Todo, In Progress and Done.
- **Task Priority:** Assign Low, Medium and High priority.
- **Search:** Search tasks by title.
- **Filtering:** Filter tasks by status.
- **Data Ownership:** Users can only access their own projects and tasks.
- **Responsive Design:** Designed for desktop and mobile screens.

## 2. Technology Stack

| Category | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Hono, TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS, shadcn/ui |
| Validation | Zod |
| Authentication | JWT, HTTP-only Cookies |
| Password Hashing | bcrypt |

## 3. Project Structure

```text
taskboard/
│
├── client/                              # React frontend
│   │
│   ├── public/                          # Static assets
│   │
│   ├── src/
│   │   ├── components/                  # Reusable React components
│   │   │   ├── ui/                      # shadcn/ui components
│   │   │   └── LogoutButton.tsx         # Logout functionality
│   │   │
│   │   ├── lib/
│   │   │   └── api.ts                   # Centralized API client
│   │   │
│   │   ├── pages/                       # Application pages
│   │   │   ├── LoginPage.tsx            # User login page
│   │   │   ├── SignupPage.tsx           # User registration page
│   │   │   ├── ProjectsPage.tsx         # Project listing and management
│   │   │   └── ProjectDetailsPage.tsx   # Project and task management
│   │   │
│   │   ├── services/
│   │   │   └── authService.ts           # Authentication API functions
│   │   │
│   │   ├── App.tsx                      # Routing and route protection
│   │   └── main.tsx                     # React application entry point
│   │
│   ├── .env.example                     # Frontend environment variables
│   ├── vercel.json                      # API proxy and SPA route fallback
│   ├── package.json                     # Frontend dependencies and scripts
│   └── vite.config.ts                   # Vite configuration
│
├── server/                              # Hono backend
│   │
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/                  # Database table definitions
│   │   │   │   ├── users.ts             # User table schema
│   │   │   │   ├── projects.ts          # Project table schema
│   │   │   │   ├── tasks.ts             # Task table schema
│   │   │   │   └── index.ts             # Schema exports
│   │   │   │
│   │   │   ├── index.ts                 # PostgreSQL and Drizzle connection
│   │   │   └── migrate.ts               # Database migration runner
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.ts                  # Authentication middleware
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts                  # Authentication endpoints
│   │   │   ├── projects.ts              # Project CRUD endpoints
│   │   │   └── tasks.ts                 # Task CRUD and filtering endpoints
│   │   │
│   │   ├── lib.ts                       # Shared backend utilities
│   │   └── server.ts                    # Hono application and route registration
│   │
│   ├── drizzle/                         # SQL migration files and metadata
│   │   └── meta/                        # Migration metadata
│   │
│   ├── drizzle.config.ts                # Drizzle ORM configuration
│   ├── .env.example                     # Backend environment variables
│   └── package.json                     # Backend dependencies and scripts
│
├── .gitignore                           # Files excluded from Git
└── README.md                             # Project documentation
```

### Frontend (`client/`)

- **components/** – Reusable React components used across the application.
- **components/ui/** – Reusable UI components from shadcn/ui.
- **lib/api.ts** – Centralized HTTP client for communicating with the backend.
- **pages/** – Contains login, signup, projects and project details pages.
- **services/authService.ts** – Handles authentication API requests.
- **App.tsx** – Manages application routing and protected routes.
- **main.tsx** – Entry point of the React application.

### Backend (`server/`)

- **db/schema/** – Defines PostgreSQL tables using Drizzle ORM.
- **db/index.ts** – Establishes the PostgreSQL database connection.
- **db/migrate.ts** – Executes database migration files.
- **middleware/** – Contains authentication middleware.
- **routes/** – Defines authentication, project and task API endpoints.
- **lib.ts** – Contains shared backend utilities.
- **server.ts** – Initializes the Hono application and registers API routes.
- **drizzle/** – Stores SQL migration files and migration metadata.
- **drizzle.config.ts** – Configures Drizzle ORM and migrations.

## 4. Prerequisites

Install the following:

- Node.js (LTS)
- npm
- PostgreSQL

Verify the installations:

```bash
node --version
npm --version
psql --version
git --version
```

## 5. PostgreSQL Setup

TaskBoard uses PostgreSQL as its database.

### Windows

Open SQL Shell (psql) or pgAdmin and execute:

```sql
CREATE USER taskboard_user WITH PASSWORD 'your_secure_password';

CREATE DATABASE taskboard OWNER taskboard_user;
```

### Linux (Ubuntu)

Open PostgreSQL:

```bash
sudo -u postgres psql
```

Create the database user and database:

```sql
CREATE USER taskboard_user WITH PASSWORD 'your_secure_password';

CREATE DATABASE taskboard OWNER taskboard_user;
```

Exit PostgreSQL:

```sql
\q
```

### macOS

Open PostgreSQL:

```bash
psql postgres
```

Create the database user and database:

```sql
CREATE USER taskboard_user WITH PASSWORD 'your_secure_password';

CREATE DATABASE taskboard OWNER taskboard_user;
```

Exit PostgreSQL:

```sql
\q
```

### Verify Database Connection

Run this command on Windows, Linux or macOS:

```bash
psql -h localhost -U taskboard_user -d taskboard
```

Enter your PostgreSQL password when prompted.

## 6. Clone the Repository

```bash
git clone https://github.com/gopalpatil37/taskboard.git

cd taskboard
```

## 7. Backend Setup

Navigate to the backend directory:

```bash
cd server
```

Install dependencies:

```bash
npm ci
```

Create the environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

### Configure server/.env

Update your PostgreSQL credentials and JWT secret:

```env
DATABASE_URL=postgresql://taskboard_user:your_secure_password@localhost:5432/taskboard
JWT_SECRET=your_random_secret_of_at_least_16_characters
CLIENT_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Generate your own secure JWT secret. Never use example credentials in production.

### Run Database Migrations

From the `server/` directory:

```bash
npx tsx src/db/migrate.ts
```

This applies the database migration files and creates the required tables.

### Start the Backend

```bash
npm run dev
```

Backend URL: http://localhost:3000

## 8. Frontend Setup

Open a second terminal from the project root:

```bash
cd client
```

Install dependencies:

```bash
npm ci
```

Create the environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

### Configure client/.env

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Start the Frontend

```bash
npm run dev
```

Frontend URL: http://localhost:5173

Open the frontend URL in your browser and register an account.

## 9. API Endpoints

All backend endpoints use the `/api` prefix.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/:projectId/tasks` | Create task |
| GET | `/api/projects/:projectId/tasks` | List project tasks |
| PATCH | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| DELETE | `/api/tasks/:id` | Delete task |

Task listing supports status filtering and title search.

Example:

```text
GET /api/projects/1/tasks?status=todo&search=backend
```

## 10. Authentication and Security

- Passwords are hashed using bcrypt before storage.
- JWT authentication uses an HTTP-only cookie.
- The cookie is `SameSite=Lax` with `Secure=false` locally, and `SameSite=None` with `Secure=true` in production. It expires after seven days.
- Authentication middleware protects private API routes.
- Zod validates incoming API data.
- Ownership checks prevent users from accessing other users' projects and tasks.
- PostgreSQL foreign keys maintain database relationships.
- Deleting a project automatically deletes its associated tasks through cascading deletion.

## 11. Useful Commands

### Frontend

Run from the `client/` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Build production frontend |

### Backend

Run from the `server/` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm start` | Start production server |

## 12. Environment Variables

The repository contains separate environment templates:

- [Client Environment](client/.env.example)
- [Server Environment](server/.env.example)

Create local `.env` files using these templates.

**Important:** Never commit actual `.env` files, passwords, JWT secrets or database credentials to GitHub.

## 13. Deployment

- **Frontend (Vercel):** [https://taskboard-rho-azure.vercel.app](https://taskboard-rho-azure.vercel.app)
- **Backend (Render):** [https://taskboard-api-lm8y.onrender.com](https://taskboard-api-lm8y.onrender.com)

The Vercel configuration in `client/vercel.json` proxies `/api/*` requests to the Render backend and serves the React app for frontend routes. The deployed frontend uses this same-origin API base:

```env
VITE_API_BASE_URL=https://taskboard-rho-azure.vercel.app
```

Configure the backend's `CLIENT_ORIGIN` as `https://taskboard-rho-azure.vercel.app` and set `NODE_ENV=production` in Render. Set `DATABASE_URL` and a strong `JWT_SECRET` in the hosting provider's environment settings; do not put production secrets in this repository. Redeploy the frontend after changing its Vercel environment variables.

**Demo access:** Create an account using the Sign up page. This repository does not publish shared demo credentials.

## 14. Future Improvements

- Add automated API and frontend tests.
- Implement pagination for task lists.
- Add CI/CD workflows.
- Improve application monitoring and error logging.

---

**Built with React, TypeScript, Hono, Drizzle ORM and PostgreSQL.**