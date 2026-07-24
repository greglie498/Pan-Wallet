# PanWallet — Project Context

**A unified virtual wallet enabling cross-network mobile money transfers across Africa.**

This document is the living reference for implementation. It reflects the original academic
report (`PanWallet.pdf`) reconciled with every decision and change made across all three
sprints. Where the implementation diverges from the PDF, this document records what was
actually built and why.

---

## 1. Problem Statement

Mobile money has driven major financial inclusion gains across Africa (1B+ registered
accounts by 2023), yet ~57% of sub-Saharan adults remain unbanked, and major providers —
M-Pesa, MTN MoMo, Orange Money, Airtel Money — operate as closed, proprietary networks.
A trader using M-Pesa cannot send funds directly to a supplier on MTN MoMo without
intermediaries, extra fees, and delays. This fragmentation hits low-income users, informal
traders, and SMEs hardest, and undermines AfCFTA's regional integration goals. Existing
solutions don't close the gap: Wise/PayPal depend on bank infrastructure most users lack;
Chipper Cash is a closed ecosystem; Flutterwave is B2B infrastructure, not a consumer app.
No consumer-facing, provider-agnostic app lets users hold and move money across networks
from one interface.

## 2. Objectives

**General:** Build a unified virtual wallet that integrates directly with mobile money provider
APIs to enable real-time, cross-network, cross-border transfers with multi-currency support.

**Specific:**
1. Review existing digital payment/mobile money platforms to identify gaps.
2. Design and build a prototype integrating African mobile money provider APIs (M-Pesa
   Daraja, MTN MoMo) for account linking and real-time cross-network transfers via REST APIs.
3. Test and evaluate the prototype against the stated problem.

**Provider scope decision (Sprint 2):** The PDF originally specified M-Pesa + Orange Money.
Orange Money was replaced with **MTN MoMo** after assessment revealed that Orange Money
has no unified public API across its African markets — each country subsidiary (Orange Sonatel,
Orange Côte d'Ivoire, etc.) operates independently with separate developer portals and
restricted sandbox access. MTN MoMo covers 17 African countries through a single unified
API at `momodeveloper.mtn.com` with a fully public sandbox — a significantly stronger
pan-African coverage story and a proper developer experience. The PDF's objectives section
should be updated to reflect M-Pesa + MTN MoMo as the two integrated providers.

## 3. Functional Requirements

| ID | Requirement | Final status |
|---|---|---|
| FR1 | User registration | ✅ **Implemented.** Phone number + password (bcrypt) + JWT. Firebase OTP was attempted but blocked by billing requirements (Blaze plan required even for test numbers). Password auth is the production path for this submission. Admin registration handled separately via seed script. |
| FR2 | User login, session token issued | ✅ **Implemented.** Password login issues access token (15 min) + refresh token (7 days) with rotation and reuse/theft detection. Admin login issues same token structure with `role: "ADMIN"` claim. |
| FR3 | Link multiple mobile money accounts | ✅ **Implemented.** `POST /wallets/link` links M-Pesa or MTN MoMo wallets to a user's profile. Duplicate detection via compound unique constraint `(provider, walletNumber)`. `DELETE /wallets/:id/unlink` removes external wallets; internal wallet cannot be unlinked. |
| FR4 | View real-time balances of all linked wallets | ✅ **Implemented.** `GET /wallets` and `GET /wallets/:id` return all wallets with live balance data. Frontend displays balances in each wallet's native currency. |
| FR5 | Initiate cross-network transfer | ✅ **Implemented.** `POST /transactions` initiates a transfer after validating sender wallet ownership, active status, and sufficient balance. |
| FR6 | Fetch live exchange rate before confirming | ✅ **Implemented.** `POST /transactions/quote` fetches live rate from ExchangeRate-API and returns full breakdown (amount, converted amount, rate, fee, total deducted) before the user confirms. |
| FR7 | Explicit transfer confirmation screen | ✅ **Implemented.** Frontend quote screen → confirm screen flow. User sees full breakdown before committing. |
| FR8 | Process transfer via provider APIs | ✅ **Implemented (sandbox).** M-Pesa Daraja STK push and MTN MoMo Request to Pay are both integrated against sandbox environments. In development mode, transactions auto-complete when the provider callback URL is rejected by Daraja sandbox (known sandbox limitation). |
| FR9 | Record every transaction in PostgreSQL | ✅ **Implemented.** Every transfer creates an exchange rate record and a transaction record atomically in a Prisma transaction. Status transitions (PENDING → COMPLETED/FAILED) are recorded with timestamps. Provider reference ID stored for audit trail. |
| FR10 | Transaction history | ✅ **Implemented.** `GET /transactions` returns all user transactions ordered by date. Frontend shows filterable history (All/Completed/Pending/Failed) with pull-to-refresh. |
| FR11 | In-app success/failure notification | ✅ **Implemented.** Alert dialogs on transfer success/failure. Transaction detail screen polls every 5 seconds while status is PENDING. |
| FR12 | Multi-currency display | ✅ **Implemented.** Each wallet displays balance in its native currency (USD for internal, KES for M-Pesa, XOF for MTN MoMo). Exchange rate shown on every transaction record. |

**Additional features implemented beyond original spec:**

| Feature | Description |
|---|---|
| Balance top-up | `POST /wallets/:id/topup` — simulated sandbox top-up adds USD to internal wallet. Frontend has dedicated top-up screen with quick-select amounts and post-top-up balance preview. |
| Balance validation | Transfer is rejected at the service layer if `senderWallet.balance < requestedAmount`. Error message includes available and required amounts. |
| Admin user type | Separate Admin model, separate login endpoint (`POST /admin/login`), role-based JWT (`role: "ADMIN"`), protected admin middleware. Admin sees a dedicated tab in the app. |
| Admin dashboard | Stats endpoint returns total users, transactions, volume, success rate, transactions by status/provider, and daily volume for 7 days. Rendered as bar charts and pie charts in the app. |
| Admin user list | `GET /admin/users` — paginated user list with wallet count and join date. |
| Admin transaction list | `GET /admin/transactions` — all transactions across all users with sender details. |
| Dark mode | NativeWind v4 class-based dark mode with manual toggle (sun/moon button). Preference persisted to device secure storage. |
| Dashboard charts | Bar chart (7-day transaction volume) and pie chart (spend by provider) on the user dashboard. |

## 4. Core Entities

The Prisma schema implements 6 models — all 5 from the PDF ERD plus RefreshToken:

- **User** — id (UUID), phoneNumber (unique), name, email (optional), password (nullable — supports both password auth and future OTP paths), status (ACTIVE/SUSPENDED/DELETED). Relations: wallets, refreshTokens.

- **Wallet** — id, userId (FK), provider (`PANWALLET_INTERNAL` | `MPESA` | `MTN_MOMO`), walletNumber, currency (3-char ISO code), balance (`Decimal(18,2)` — never float), status (ACTIVE/SUSPENDED/CLOSED). Compound unique on `(provider, walletNumber)`. Index on `userId`.

- **Transaction** — id, senderWalletId (FK), recipientWalletId (FK, nullable), recipientProvider, recipientNumber, providerReferenceId (M-Pesa CheckoutRequestID or MTN referenceId), amount, fee, exchangeRateId (FK), status (PENDING/COMPLETED/FAILED/REVERSED), failureReason. Indexes on senderWalletId and recipientWalletId.

- **ExchangeRate** — id, sourceCurrency, targetCurrency, rate (`Decimal(18,6)`), recordedAt. Stored per-transaction so audit trail reflects the exact rate applied at transfer time. Index on (sourceCurrency, targetCurrency).

- **Admin** — id, username (unique), email (unique), password, role (SUPER_ADMIN/SUPPORT). Fully separate from User. Never appears in the customer-facing flow.

- **RefreshToken** *(not in PDF ERD — required by JWT auth)* — id, userId (FK), tokenHash (SHA-256 of raw token — never stores raw token), family (UUID grouping tokens from the same login session), revoked (Boolean), expiresAt. Family-level revocation is the token theft response mechanism.

## 5. Architecture

### Backend — Clean Architecture (layered)

```
backend/src/
├── server.ts              — process bootstrap, DB connect, graceful shutdown
├── app.ts                 — Express assembly: middleware, routes, Swagger, error handler
├── config/                — env.ts (Zod validation, fails fast), logger.ts (Winston)
├── domain/                — errors.ts (AppError hierarchy), enums.ts (decoupled from Prisma)
├── application/
│   ├── auth/              — auth.service.ts, auth.types.ts
│   ├── wallets/           — wallet.service.ts
│   ├── transactions/      — transaction.service.ts, transaction.types.ts
│   └── admin/             — admin.service.ts, admin.stats.service.ts
├── infrastructure/
│   ├── database/          — prisma.ts (singleton client)
│   ├── repositories/      — user, wallet, refresh-token, transaction,
│   │                        exchange-rate, admin repositories
│   ├── providers/         — mpesa.provider.ts, mtn-momo.provider.ts,
│   │                        exchange-rate.provider.ts
│   └── security/          — jwt.service.ts, password.service.ts
├── interfaces/http/
│   ├── routes.ts
│   ├── controllers/       — auth, wallet, transaction, admin controllers
│   ├── middleware/         — authenticate, authenticate-admin, error-handler,
│   │                        rate-limit, validate
│   └── validators/        — auth, wallet, transaction, admin validators (Zod)
└── shared/                — async-handler.ts, http-response.ts
```

Enforced flow: **Controller → Service → Repository → Prisma.** Providers sit in infrastructure alongside repositories — they're external API clients, not business logic. Services orchestrate repositories and providers but never import Prisma directly.

### Frontend — React Native (Expo SDK 57)

```
frontend/
├── app/
│   ├── _layout.tsx              — root: fonts, auth init, theme init, dark class
│   ├── index.tsx                — redirect based on auth state
│   ├── (auth)/                  — welcome, phone (login/register/admin tabs)
│   └── (app)/                   — tab navigator (Home, Wallets, History, Admin)
│       ├── dashboard.tsx        — balance, charts, wallets, recent transactions
│       ├── topup.tsx            — balance top-up screen
│       ├── wallets/             — index (list + unlink), link
│       ├── transactions/        — index (history), quote, confirm, [id] (detail)
│       └── admin/               — index (stats + charts), users, transactions
├── components/
│   ├── ui/                      — Button, Input, Card, Badge
│   └── ThemeToggle.tsx
├── lib/
│   ├── api/                     — client (Axios + interceptors), auth, wallet,
│   │                              transaction, admin API functions
│   └── store/                   — auth.store, wallet.store, theme.store (Zustand)
└── constants/theme.ts
```

Navigation pattern: Expo Router file-based routing. Role-based tab visibility — Admin tab only appears when `isAdmin === true` in auth store. All protected routes guarded by `authenticate` check in `(app)/_layout.tsx`.

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 20+ + TypeScript (strict, `noUncheckedIndexedAccess`) |
| Web framework | Express.js |
| Database | PostgreSQL 15+ via Prisma ORM 5+ |
| Auth | bcrypt (password hashing) + JWT (access/refresh tokens, role claims) |
| Validation | Zod (env vars + all request bodies) |
| Security | helmet, cors, express-rate-limit (two-tier) |
| Logging | Winston (JSON production, colorized dev) |
| API docs | OpenAPI 3.0 via swagger-ui-express (`/api-docs`) |
| Provider: M-Pesa | Daraja API v2 (sandbox: `sandbox.safaricom.co.ke`) |
| Provider: MTN MoMo | MTN MoMo Collection + Disbursement APIs (sandbox: `sandbox.momodeveloper.mtn.com`) |
| Exchange rates | ExchangeRate-API v6 (free tier) |
| Mobile frontend | React Native 0.86 + Expo SDK 57 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind for React Native) |
| State management | Zustand |
| HTTP client | Axios with JWT interceptor + automatic token refresh |
| Token storage | expo-secure-store (encrypted device keychain) |
| Charts | react-native-gifted-charts |
| Build | EAS Build (Expo Application Services) |

## 7. Key Implementation Decisions

**Auth method (Firebase OTP → password+JWT):** Firebase phone authentication requires the Blaze (pay-as-you-go) billing plan. Even test phone numbers stopped working without billing enabled. Password + JWT was adopted as the production auth method. The architecture supports adding OTP as an additional auth path later without changing the JWT or downstream infrastructure.

**Orange Money → MTN MoMo:** Replaced in Sprint 2 due to fragmented API landscape. Orange Money has no unified pan-African API — each subsidiary is independent with separate portals and restricted sandbox access. MTN MoMo provides a single unified API covering 17 countries with a fully public sandbox. The `WalletProvider` enum was updated and a migration was run.

**Daraja sandbox callback URL:** Safaricom's sandbox rejects ngrok URLs for STK push callbacks. In development mode, the service catches the Daraja 400 error and auto-completes the transaction with a `SANDBOX-{id}` reference. In production, a stable HTTPS URL resolves this. This is a known sandbox limitation, not a production architecture decision.

**Balance currency:** Internal (`PANWALLET_INTERNAL`) wallet uses USD as the reference currency. M-Pesa wallets use KES, MTN MoMo wallets use XOF (sandbox) or country-specific currency in production. Balance validation compares only the USD amount against the internal wallet — provider fees are deducted on the recipient side in the recipient's currency.

**Admin role:** Admin is a completely separate entity from User — separate Prisma model, separate login endpoint, separate JWT role claim (`role: "ADMIN"`), separate middleware (`authenticateAdmin`). Admin tokens pass through the same JWT signing infrastructure but are validated by different middleware. The mobile app detects the role from the auth store and conditionally shows the Admin tab.

## 8. Repository Structure

```
PanWallet/
├── backend/
│   ├── README.md
│   ├── PROJECT_CONTEXT.md        ← this file
│   ├── package.json / tsconfig.json / nodemon.json / eas.json
│   ├── .env.example
│   ├── docs/openapi.yaml
│   ├── prisma/schema.prisma, seed.ts, migrations/
│   └── src/  (see §5)
└── frontend/
    ├── app.json
    ├── babel.config.js / metro.config.js / tailwind.config.js
    ├── global.css
    ├── google-services.json
    ├── .env
    └── app/ components/ lib/ constants/  (see §5)
```

## 9. API Surface (complete)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | None | Liveness check |
| GET | `/api-docs` | None | Swagger UI |
| POST | `/api/v1/auth/register` | None | User registration |
| POST | `/api/v1/auth/login` | None | User login |
| POST | `/api/v1/auth/refresh` | None | Refresh token pair |
| POST | `/api/v1/auth/logout` | None | Revoke refresh token |
| GET | `/api/v1/wallets` | User | List user wallets |
| GET | `/api/v1/wallets/:id` | User | Get single wallet |
| POST | `/api/v1/wallets/link` | User | Link M-Pesa or MTN MoMo |
| POST | `/api/v1/wallets/:id/topup` | User | Sandbox balance top-up |
| DELETE | `/api/v1/wallets/:id/unlink` | User | Unlink external wallet |
| POST | `/api/v1/transactions/quote` | User | Get live transfer quote |
| POST | `/api/v1/transactions` | User | Initiate transfer |
| GET | `/api/v1/transactions` | User | List user transactions |
| GET | `/api/v1/transactions/:id` | User | Get single transaction |
| POST | `/api/v1/transactions/mpesa/callback` | None | M-Pesa payment callback |
| POST | `/api/v1/transactions/mtn/callback` | None | MTN MoMo payment callback |
| POST | `/api/v1/admin/login` | None | Admin login |
| GET | `/api/v1/admin/stats` | Admin | System-wide stats |
| GET | `/api/v1/admin/users` | Admin | Paginated user list |
| GET | `/api/v1/admin/transactions` | Admin | All transactions |

## 10. Sprint Summary

**Sprint 1 — Backend Foundation (completed)**
Project setup, Prisma schema, domain layer, security infrastructure, repositories, auth + wallet services, HTTP middleware, controllers, routes, app bootstrap, OpenAPI spec, seed script.

**Sprint 2 — Provider Integration + Extended Backend (completed)**
Auth updated (Firebase OTP attempted, reverted to password), wallet linking (FR3), M-Pesa Daraja sandbox integration, MTN MoMo sandbox integration (replaced Orange Money), ExchangeRate-API integration, transaction service (FR5–FR9), balance top-up endpoint, balance validation, admin auth + routes, admin stats endpoints.

**Sprint 3 — Frontend + Extensions (completed)**
React Native (Expo SDK 57) app: auth screens (welcome, login/register/admin), dashboard with charts, wallet screens (list, link, top-up), transaction screens (quote, confirm, history, detail), admin screens (stats, user list, transaction list), dark mode, role-based navigation, Zustand state management, Axios API client with automatic token refresh, EAS Build for Android.

**Known gaps / deferred to production:**
- Automated test suite (Jest) — not implemented
- Firebase OTP — requires Blaze billing plan
- Live Daraja callback URL — requires stable HTTPS domain (not ngrok)
- Production deployment — backend runs locally; no cloud hosting configured
- iOS build — Android only (no Apple Developer account)
- MTN MoMo disbursement (sending to recipient) — Collection (receiving) integrated but disbursement flow not connected to the transaction service in sandbox

---
*Last updated after Sprint 3 completion. Sources: `PanWallet.pdf` (academic report, Chapters 1–5) and implementation sessions across Sprint 1, Sprint 2, and Sprint 3.*