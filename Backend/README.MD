# PanWallet — Backend (Sprint 1)

Unified virtual wallet enabling cross-network mobile money transfers across Africa. This is the **Sprint 1** backend: server bootstrap, user registration/login with JWT sessions, and listing a user's wallets.

See `PROJECT_CONTEXT.md` for full business requirements and `docs/openapi.yaml` for the API contract (rendered at `/api-docs` once the server is running).

## Stack

Node.js, TypeScript, Express, PostgreSQL, Prisma. Clean Architecture: Controller → Service → Repository → Prisma.

## Setup

\`\`\`bash
npm install
cp .env.example .env        # fill in DATABASE_URL and both JWT secrets
npx prisma migrate dev      # creates the schema in your local database
npm run dev                 # starts the API with hot reload on $PORT (default 4000)
\`\`\`

Optional admin bootstrap: set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` in `.env`, then `npm run seed`.

## Endpoints (Sprint 1)

| Method | Path | Auth required |
|---|---|---|
| GET | `/health` | No |
| GET | `/api-docs` | No |
| POST | `/api/v1/auth/register` | No |
| POST | `/api/v1/auth/login` | No |
| POST | `/api/v1/auth/refresh` | No |
| POST | `/api/v1/auth/logout` | No |
| GET | `/api/v1/wallets` | Yes — `Authorization: Bearer <accessToken>` |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with nodemon + ts-node |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Apply a new local migration |
| `npm run prisma:deploy` | Apply migrations in a deployed environment |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Run `prisma/seed.ts` |

## Architecture

\`\`\`
src/
├── server.ts           # process bootstrap, graceful shutdown
├── app.ts               # Express app: middleware, routes, error handling
├── config/               # env validation, logger
├── domain/               # shared enums, AppError hierarchy
├── application/          # business logic (services)
├── infrastructure/       # Prisma client, repositories, JWT/bcrypt
├── interfaces/http/      # controllers, routes, middleware, validators
└── shared/                # asyncHandler, response envelope
\`\`\`

Controllers stay thin; business logic lives in services; all database access goes through repositories.

## Sprint 1 scope

**Implemented:** registration/login/refresh/logout (phone + password + JWT with refresh-token rotation and reuse detection), an auto-provisioned internal wallet per user, listing a user's wallets.

**Deferred to later sprints:** Firebase OTP auth, linking external M-Pesa/Orange Money accounts, M-Pesa Daraja / Orange Money / ExchangeRate-API integrations, automated tests.