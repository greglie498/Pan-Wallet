# PanWallet Backend

REST API for the PanWallet mobile app. It uses Node.js, TypeScript, Express 5, PostgreSQL, Prisma, JWT, Firebase Admin, and sandbox adapters for M-Pesa, MTN MoMo, and exchange rates.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Set every required value in `.env` before starting. In particular, use strong `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PROVIDER_CALLBACK_TOKEN` values; configure `BASE_URL` to the publicly reachable backend URL for provider callbacks.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the TypeScript server with hot reload. |
| `npm run build` | Compile to `dist/`. |
| `npm run typecheck` | Run TypeScript checks. |
| `npm run prisma:migrate` | Create and apply a development migration. |
| `npm run prisma:deploy` | Apply committed migrations in deployment. |
| `npm run seed` | Create the optional configured administrator. |

## API

Swagger UI is available at `http://localhost:4000/api-docs`. The source contract is [docs/openapi.yaml](./docs/openapi.yaml).

The API provides user password and Firebase authentication, JWT refresh rotation, wallets, transfer quotes and initiation, callbacks, transaction history, and administrator metrics.

All API paths are under `/api/v1`; protected endpoints require `Authorization: Bearer <accessToken>`.

## Security behavior

Transfers reserve the amount plus fee before a provider request. Failed provider initiation and failed callbacks refund the reservation. Provider callbacks include a secret token generated from `PROVIDER_CALLBACK_TOKEN`; do not expose it in the mobile client or logs.
