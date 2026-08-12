# DevPilot AI — AI Codebase Assistant

DevPilot AI lets you import a GitHub repository or upload a ZIP archive and then chat
with an AI assistant that actually understands your code. It can explain the
architecture, generate a README, produce API documentation, and hunt for bugs and
security issues — all grounded in the real contents of your repository via
retrieval-augmented generation with **Google Gemini**.

> A portfolio-quality, production-style full-stack application demonstrating modern
> Node.js/Express backend architecture, React front-end engineering, JWT auth, safe
> file handling, and applied LLM integration.

> **Screenshots:** add real screenshots to `docs/screenshots/` and reference them here
> once the app is deployed, e.g.:
>
> - `docs/screenshots/landing.png` — Landing page
> - `docs/screenshots/dashboard.png` — Dashboard (imported repositories & recent conversations)
> - `docs/screenshots/repository.png` — Repository page (file tree + AI tools)
> - `docs/screenshots/chat.png` — Repository-aware AI chat with markdown & syntax highlighting

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [API documentation](#api-documentation)
- [Security](#security)
- [Testing](#testing)
- [Deployment guide](#deployment-guide)
- [Roadmap ideas](#roadmap-ideas)
- [License](#license)

## Features

- **Authentication** — register/login with JWT, bcrypt-hashed passwords, protected routes.
- **Repository import** — clone a public GitHub repo (`simple-git`) or upload a `.zip`
  archive (`multer` + `unzipper`), with safe extraction that rejects path traversal
  ("zip-slip"), symlinks, and dangerous paths.
- **Code processing pipeline** — recursively scans the repository, skips
  `node_modules`, `.git`, `dist`, `build`, binaries, images, videos and archives,
  reads supported text/code extensions, and splits large files into overlapping
  chunks stored in MongoDB.
- **Retrieval-augmented chat** — keyword-based retrieval selects the most relevant
  code chunks for a question, builds a context window, and sends it to Gemini with a
  strict system prompt ("use only the provided context").
- **AI tools** — generate a full README, generate Express API documentation, and run
  a bug/security finder with severity ratings — all as downloadable markdown.
- **Conversation history** — every chat/README/docs/bug-finder run is stored per user
  + repository and can be reopened later.
- **Modern dark UI** — React + Tailwind CSS + Framer Motion, with a landing page,
  auth pages, dashboard, repository detail page (file tree + AI tools), and a full
  chat experience (bubbles, markdown, syntax-highlighted code blocks, typing
  indicator, auto-scroll, copy-to-clipboard, and `.md` download).
- **Production-minded backend** — Helmet, CORS, rate limiting, `express-validator`
  input validation, centralized structured error handling, Mongo sanitization, and
  file type/size validation.

## Tech stack

**Frontend:** React 19, Vite, React Router, Axios, Tailwind CSS v4, React Markdown
(+ remark-gfm), React Syntax Highlighter, Framer Motion, react-hot-toast, lucide-react.

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs, Multer, simple-git,
unzipper, dotenv, cors, helmet, express-rate-limit, express-validator,
express-mongo-sanitize.

**AI:** Google Gemini (`@google/genai`), model `gemini-3.6-flash` by default (configurable via `GEMINI_MODEL`).

## Architecture

```
                                   ┌─────────────────────────────┐
                                   │        React (Vite)         │
                                   │  Landing / Auth / Dashboard │
                                   │  Repository page / Chat UI  │
                                   └──────────────┬───────────────┘
                                                  │ Axios (JWT bearer)
                                                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            Express API (server/)                          │
│                                                                             │
│  ┌───────────┐   ┌────────────────┐   ┌───────────────┐   ┌─────────────┐ │
│  │  Auth     │   │  Repositories  │   │  AI           │   │Conversations│ │
│  │  routes   │   │  routes        │   │  routes       │   │  routes     │ │
│  └─────┬─────┘   └───────┬────────┘   └──────┬────────┘   └──────┬──────┘ │
│        │                 │                    │                    │      │
│        ▼                 ▼                    ▼                    ▼      │
│  ┌───────────┐   ┌────────────────┐   ┌───────────────┐   ┌─────────────┐ │
│  │ authCtrl  │   │ repositoryCtrl │   │  aiController │   │conversation │ │
│  └─────┬─────┘   └───────┬────────┘   └──────┬────────┘   │  Controller │ │
│        │                 │                    │            └──────┬──────┘ │
│        │        ┌────────┴─────────┐          │                   │       │
│        │        ▼                  ▼           ▼                   │       │
│        │  ┌───────────┐    ┌──────────────┐  ┌──────────────────┐  │       │
│        │  │ gitService│    │  zipService  │  │ retrievalService  │  │       │
│        │  └─────┬─────┘    └──────┬───────┘  │ + promptTemplates │  │       │
│        │        │                 │           │ + geminiService  │  │       │
│        │        └────────┬────────┘           └────────┬─────────┘  │       │
│        │                 ▼                              ▼            │       │
│        │       ┌───────────────────┐             ┌─────────────┐     │       │
│        │       │codeProcessing     │             │  Gemini API │     │       │
│        │       │Service (chunking) │             │ (gemini-2.5-│     │       │
│        │       └─────────┬─────────┘             │   flash)    │     │       │
│        │                 │                       └─────────────┘     │       │
│        ▼                 ▼                                            ▼       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                     MongoDB (Users, Repositories,                       │  │
│  │                     CodeChunks, Conversations)                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

**Request flow for a chat question:**

1. Client sends `POST /api/ai/chat` with `{ repoId, question }` and a JWT.
2. `retrievalService` tokenizes the question and scores every `CodeChunk` for that
   repository by keyword overlap (lightweight, dependency-free retrieval — no vector
   DB required).
3. The top-scoring chunks are concatenated into a bounded context string.
4. `promptTemplates.buildChatPrompt` combines the system prompt, context, and
   question into a single prompt.
5. `geminiService` calls the Gemini API and returns markdown.
6. The Q&A pair is persisted to the `Conversation` collection and returned to the
   client, which renders it with syntax-highlighted markdown.

## Project structure

```
.
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (chat bubbles, file tree, modals, ui/*)
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── lib/                # Axios instance
│   │   ├── pages/               # Landing, Login, Register, Dashboard, Repository, Chat
│   │   └── App.jsx / main.jsx
│   └── vercel.json
├── server/                     # Express backend
│   ├── controllers/            # authController, repositoryController, aiController, conversationController
│   ├── routes/                 # authRoutes, repositoryRoutes, aiRoutes, conversationRoutes
│   ├── middleware/              # auth (JWT), errorHandler, rateLimiters, upload (multer), validate
│   ├── services/                # gitService, zipService, codeProcessingService, retrievalService,
│   │                            # promptTemplates, geminiService, repositoryService
│   ├── models/                  # User, Repository, CodeChunk, Conversation
│   ├── utils/                   # AppError, fileRules, generateToken, fileTreeSummary
│   ├── config/                  # env.js, db.js
│   ├── scripts/                 # smokeTest.js (end-to-end backend smoke test)
│   ├── uploads/ repos/ temp/    # runtime storage (gitignored, .gitkeep committed)
│   └── app.js
├── render.yaml                  # Render blueprint for the backend
├── .env.example                 # Backend environment variable template
└── package.json                 # Root scripts (installs & runs both apps together)
```

## Getting started

### Prerequisites

- Node.js 20+ (required by the `@google/genai` SDK)
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key for Gemini (free tier)

### Installation

```bash
git clone <this-repo-url>
cd devpilot-ai   # or whatever you cloned this repo as
npm run install:all   # installs both server/ and client/ dependencies
```

Copy the environment template and fill in your values:

```bash
cp .env.example server/.env
```

## Environment variables

Set these in `server/.env` (see `.env.example` for the canonical template):

| Variable             | Description                                                            | Example                                              |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| `PORT`                | Port the Express server listens on                                      | `5000`                                                 |
| `NODE_ENV`            | `development` or `production`                                           | `development`                                          |
| `CLIENT_URL`          | Frontend origin, used for CORS                                          | `http://localhost:5173`                                |
| `MONGODB_URI`         | MongoDB connection string (local or Atlas)                              | `mongodb://localhost:27017/devpilot-ai`                |
| `JWT_SECRET`          | Secret used to sign JWTs — use a long random string in production       | `openssl rand -hex 32`                                 |
| `JWT_EXPIRES_IN`      | JWT expiry                                                               | `7d`                                                    |
| `GEMINI_API_KEY`      | Google Gemini API key from AI Studio                                    | `AIza...`                                              |
| `GEMINI_MODEL`        | Gemini model name                                                        | `gemini-3.6-flash`                                     |
| `MAX_UPLOAD_SIZE_MB`  | Max ZIP upload size in megabytes                                        | `50`                                                    |

For the client (optional, only needed for a non-proxied production build), copy
`client/.env.example` to `client/.env` and set `VITE_API_URL` to your deployed API's
base URL (including the `/api` suffix).

## Running the app

Run both the API and the frontend concurrently from the repo root:

```bash
npm run dev
```

This starts:
- The Express API on `http://localhost:5000`
- The Vite dev server on `http://localhost:5173` (proxies `/api/*` to the backend)

Or run them individually:

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

Then open `http://localhost:5173` and register an account to get started.

## API documentation

All responses follow a consistent envelope:

```json
{ "success": true, "data": { /* ... */ } }
{ "success": false, "message": "Human-readable error" }
```

Protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Path                | Auth | Body                                | Description                     |
| ------ | ------------------- | ---- | ------------------------------------ | -------------------------------- |
| POST   | `/api/auth/register`| No   | `{ name, email, password }`          | Create an account, returns JWT   |
| POST   | `/api/auth/login`   | No   | `{ email, password }`                | Log in, returns JWT              |
| GET    | `/api/auth/me`      | Yes  | —                                     | Get the current user             |

### Repositories

| Method | Path                                   | Auth | Body / Form                              | Description                              |
| ------ | --------------------------------------- | ---- | ------------------------------------------ | ------------------------------------------ |
| POST   | `/api/repositories/import-github`       | Yes  | `{ url }`                                   | Clone + process a public GitHub repo       |
| POST   | `/api/repositories/upload`              | Yes  | `multipart/form-data` field `file` (.zip)   | Upload + process a ZIP archive             |
| GET    | `/api/repositories`                     | Yes  | —                                            | List the current user's repositories       |
| GET    | `/api/repositories/:id`                 | Yes  | —                                            | Get one repository (incl. file tree)       |
| DELETE | `/api/repositories/:id`                 | Yes  | —                                            | Delete a repository + its chunks/history   |
| POST   | `/api/repositories/:id/generate-readme` | Yes  | —                                            | Alias of `POST /api/ai/generate-readme`    |

### AI

| Method | Path                        | Auth | Body                          | Description                                          |
| ------ | ---------------------------- | ---- | -------------------------------- | ------------------------------------------------------ |
| POST   | `/api/ai/chat`               | Yes  | `{ repoId, question }`            | Ask a repository-aware question, returns markdown       |
| POST   | `/api/ai/generate-readme`    | Yes  | `{ repoId }`                      | Generate a full README.md                               |
| POST   | `/api/ai/generate-docs`      | Yes  | `{ repoId }`                      | Generate API documentation for detected Express routes  |
| POST   | `/api/ai/find-bugs`          | Yes  | `{ repoId }`                      | Analyze for bugs, dead code, duplication, security issues|

### Conversations

| Method | Path                        | Auth | Description                                       |
| ------ | ---------------------------- | ---- | --------------------------------------------------- |
| GET    | `/api/conversations/:repoId` | Yes  | List all Q&A / generation history for a repository |

### Health check

`GET /api/health` → `{ "success": true, "message": "DevPilot AI server is running" }`

## Security

- **JWT authentication** with bcrypt-hashed passwords (`bcryptjs`, salt rounds = 10).
- **Helmet** for secure HTTP headers, **CORS** locked to `CLIENT_URL`.
- **Rate limiting**: a general API limiter, a stricter auth limiter, and a dedicated
  AI limiter (LLM calls are expensive).
- **Input validation** with `express-validator` on every mutating route.
- **File type & size validation**: only `.zip` uploads are accepted (mimetype +
  extension check), capped at `MAX_UPLOAD_SIZE_MB`.
- **Safe ZIP extraction**: every entry path is normalized and checked to stay inside
  the destination directory (defends against "zip-slip"/path traversal), absolute
  paths and null bytes are rejected, and known ignored directories are skipped during
  extraction.
- **Mongo sanitization** (`express-mongo-sanitize`) to guard against NoSQL injection.
- **Centralized error handling** — no stack traces or internals leak to clients in
  production; every error response uses the `{ success: false, message }` shape.

## Testing

A dependency-free backend smoke test exercises the full stack (auth, upload,
processing, AI endpoints with a mocked Gemini client, conversations, and deletion)
against an in-memory MongoDB instance:

```bash
cd server
npm test
```

## Deployment guide

### MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (e.g. `0.0.0.0/0` for simplicity,
   or restrict to your Render egress IPs).
3. Copy the connection string into `MONGODB_URI`.

### Backend on Render

This repo includes a [`render.yaml`](./render.yaml) blueprint.

1. Push this repo to GitHub.
2. In Render, choose **New → Blueprint** and select the repo — it will detect
   `render.yaml` and configure a web service rooted at `server/`.
3. Set the secret environment variables in the Render dashboard: `MONGODB_URI`,
   `CLIENT_URL` (your Vercel URL), and `GEMINI_API_KEY`. `JWT_SECRET` is
   auto-generated by the blueprint.
4. Deploy. Render will run `npm install` then `npm start`, and health-check
   `/api/health`.

### Frontend on Vercel

1. Import the repo into Vercel and set the **Root Directory** to `client`.
2. Vercel auto-detects Vite (`vercel.json` is included for SPA rewrites).
3. Set the environment variable `VITE_API_URL` to your Render backend URL plus
   `/api`, e.g. `https://devpilot-ai-api.onrender.com/api`.
4. Deploy. Update the backend's `CLIENT_URL` env var to match your Vercel domain so
   CORS allows requests from it.

## Roadmap ideas

- Swap keyword retrieval for real vector embeddings + a vector store for larger repos.
- Stream Gemini responses token-by-token instead of waiting for the full completion.
- Support private GitHub repos via OAuth/PAT.
- Multi-file diff-aware "explain this change" tool.

## License

MIT — see [LICENSE](./LICENSE).
