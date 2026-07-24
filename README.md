# PanWallet

PanWallet is a full-stack virtual-wallet prototype for cross-network mobile-money transfers. The mobile app lets users authenticate, link wallets, top up, request a transfer quote, confirm transfers, and review their history. The API coordinates authentication, wallets, transactions, exchange rates, and an admin dashboard.

## Project structure

| Directory | Purpose |
| --- | --- |
| [Backend](./Backend) | Express, Prisma, PostgreSQL, provider adapters, Swagger API. |
| [Frontend](./Frontend) | Expo Router React Native application for Android, iOS, and web. |

## Quick start

1. Configure and start the [backend](./Backend/README.MD).
2. Set `EXPO_PUBLIC_API_URL` in `Frontend/.env` to the backend URL ending in `/api/v1`.
3. Install and start the [frontend](./Frontend/README.md).

For an Android emulator, the backend URL is normally `http://10.0.2.2:4000/api/v1`; use your computer's LAN address for a physical device.

## Important prototype note

This is an academic prototype, not a production financial service. Use only sandbox credentials and test funds. Production deployment requires certified provider integrations, callback verification agreed with each provider, an auditable double-entry ledger, reconciliation, monitoring, security testing, and regulatory approval.
