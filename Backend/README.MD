# PanWallet API

PanWallet is a virtual-wallet platform intended to make cross-network mobile-money transfers easier across Africa. This repository contains the Sprint 1 backend: account authentication, refresh-token sessions, automatic creation of an internal wallet, and wallet retrieval.

The API uses Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, and bcrypt. Interactive API documentation is available at `/api-docs` while the server is running.

> **Project status:** Sprint 1 backend. External wallet linking, payment-provider integrations, transfers, OTP authentication, and an automated test suite are not part of this checkout yet.

## Features

- Register and log in with a phone number and password.
- Issue short-lived access tokens and rotating refresh tokens.
- Revoke a session at logout.
- Create a default internal wallet when a user registers.
- Retrieve the authenticated user's wallets.
- Apply request validation, rate limiting, CORS, Helmet headers, compression, structured logging, and a consistent API response envelope.

## Prerequisites

- Node.js 20 or later
- PostgreSQL 15 or later
- npm

## Local setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create a local environment file.

   ```powershell
   Copy-Item .env.example .env
   ```

   On macOS or Linux, use `cp .env.example .env` instead.

3. Update `.env` with a reachable PostgreSQL `DATABASE_URL` and strong, unique JWT secrets. Each secret must contain at least 32 characters.

4. Generate Prisma's client and apply the development schema.

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start the API.

   ```bash
   npm run dev
   ```

The server listens on `http://localhost:4000` by default. Check `GET /health` and open `http://localhost:4000/api-docs` to verify the installation.

## Environment variables

Use [`.env.example`](./.env.example) as the canonical local-development template.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_ACCESS_SECRET` | Secret for access-token signing; 32+ characters. |
| `JWT_REFRESH_SECRET` | Secret for refresh-token signing; 32+ characters. |
| `JWT_ACCESS_EXPIRES_IN` | Access-token duration; defaults to `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token duration; defaults to `7d`. |
| `BCRYPT_SALT_ROUNDS` | Password-hashing cost; defaults to `12`. |
| `CORS_ORIGIN` | Comma-separated allowed client origins. |
| `DEFAULT_WALLET_PROVIDER` | Provider for the wallet created at registration. |
| `DEFAULT_WALLET_CURRENCY` | ISO 4217 currency for the default wallet. |

Never commit `.env` or real database, JWT, or provider credentials.

## API overview

All application endpoints are prefixed with `/api/v1`. Protected endpoints require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Liveness check. |
| `GET` | `/api-docs` | No | Swagger UI. |
| `POST` | `/api/v1/auth/register` | No | Create an account and its default wallet. |
| `POST` | `/api/v1/auth/login` | No | Start a session. |
| `POST` | `/api/v1/auth/refresh` | No | Rotate a refresh token. |
| `POST` | `/api/v1/auth/logout` | Yes | Revoke a supplied token or all user sessions. |
| `GET` | `/api/v1/wallets` | Yes | List the user's wallets. |

The full request/response contract lives in [docs/openapi.yaml](./docs/openapi.yaml); see [docs/README.md](./docs/README.md) for how to use it.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start TypeScript source with nodemon. |
| `npm run build` | Compile the project to `dist/`. |
| `npm start` | Run the compiled server. |
| `npm run typecheck` | Run TypeScript checks without output. |
| `npm run prisma:generate` | Generate the Prisma client. |
| `npm run prisma:migrate` | Create and apply a local Prisma migration. |
| `npm run prisma:deploy` | Apply committed migrations in a deployed environment. |
| `npm run prisma:studio` | Open Prisma Studio. |
| `npm run seed` | Optionally create the configured super-admin account. |

## Architecture

```
src/
├── application/      # Use-case services
├── config/           # Environment validation and logging
├── domain/           # Shared errors and enums
├── infrastructure/   # Prisma, repositories, password and JWT services
├── interfaces/http/  # Routes, controllers, validation, and middleware
├── shared/           # Async wrapper and response helpers
├── app.ts            # Express composition root
└── server.ts         # Process and database lifecycle
```

Controllers only translate HTTP requests and responses. Business rules live in `application`, while all database access is contained in `infrastructure/repositories`.

## Current limitations

- Authentication is password-based in this Sprint 1 implementation; Firebase phone OTP is planned work.
- Only the internal wallet is provisioned. M-Pesa, MTN MoMo, Orange Money, Airtel Money, transaction processing, and exchange-rate work have not been implemented here.
- There are no automated unit, integration, or end-to-end tests yet.
- The current TypeScript configuration exposes a compile-time issue in `JwtService.getRefreshTokenExpiry`; see the review notes before relying on `npm run build`.

## Security notes

This repository is appropriate for local development and academic prototyping. Before handling real money, add provider callback signature verification, idempotency protection, transaction ledger controls, security monitoring, automated tests, and an external security review.
