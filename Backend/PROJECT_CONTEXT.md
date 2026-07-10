# PanWallet — Project Context

**A unified virtual wallet enabling cross-network mobile money transfers across Africa.**

---

## 1. Problem Statement

Mobile money has driven major financial inclusion gains across Africa (1B+ registered accounts by 2023), yet ~57% of sub-Saharan adults remain unbanked, and major providers — M-Pesa, Orange Money, MTN MoMo, Airtel Money — operate as closed, proprietary networks. A trader using M-Pesa cannot send funds directly to a supplier on Orange Money without intermediaries, extra fees, and delays. This fragmentation hits low-income users, informal traders, and SMEs hardest, and undermines AfCFTA's regional integration goals. Existing solutions don't close the gap: Wise/PayPal depend on bank infrastructure most users lack; Chipper Cash is a closed ecosystem requiring its own adoption; Flutterwave is B2B infrastructure, not a consumer app. No consumer-facing, provider-agnostic app lets users hold and move money across networks from one interface.

## 2. Objectives

**General:** Build a unified virtual wallet that integrates directly with mobile money provider APIs to enable real-time, cross-network, cross-border transfers with multi-currency support, optimized for low-end devices and unstable networks.

**Specific:**
1. Review existing digital payment/mobile money platforms to identify gaps.
2. Design and build a prototype integrating African mobile money provider APIs (M-Pesa Daraja, Orange Money) for account linking and real-time cross-network transfers via REST APIs.
3. Test and evaluate the prototype against the stated problem.

MVP scope is deliberately narrowed to **M-Pesa + Orange Money** (East Africa + Francophone West Africa) to prove interoperability feasibility before extending to MTN MoMo/Airtel Money.

## 3. Functional Requirements (MVP — all 12 implemented)

| ID | Requirement | Priority |
|---|---|---|
| FR1 | User registration via phone number + Firebase OTP | High |
| FR2 | User login via phone number + OTP, session token issued | High |
| FR3 | Link multiple mobile money accounts (M-Pesa, Orange Money) | High |
| FR4 | View real-time balances of all linked wallets | High |
| FR5 | Initiate cross-network transfer (recipient, provider, amount) | High |
| FR6 | Fetch live exchange rate before confirming cross-border transfer | High |
| FR7 | Explicit transfer confirmation screen before submission | High |
| FR8 | Process transfer via provider APIs (debit/credit orchestration) | High |
| FR9 | Record every transaction in PostgreSQL (full audit trail) | High |
| FR10 | View chronological transaction history | Medium |
| FR11 | In-app success/failure notification per transfer | Medium |
| FR12 | Multi-currency display with ISO 4217 codes | Medium |

Key non-functional targets: <5s transfer response, TLS 1.2+ in transit, zero exposed API keys (server-side env vars only), usable within 5 taps for a first-time user, Android 10+/iOS 14+/2GB RAM support, 99% uptime during testing, ACID-compliant atomic transaction writes.

## 4. Core Entities (ERD)

- **User** — id, phone (auth key), name, email, status. One user → many wallets.
- **Wallet** — id, user_id (FK), wallet number, provider, balance, currency, status. One wallet → many transactions.
- **Transaction** — id, sender wallet, recipient details, amount, fees, exchange_rate_id (FK), status, timestamp. Core financial record.
- **ExchangeRate** — id, source/target currency, rate, recorded_at. One rate → many transactions (preserves historical rate per transaction).
- **Admin** — id, username, hashed password, role. Manages users, monitors transactions, generates reports; not part of the transactional flow.

## 5. Architecture

Three-tier, layered design:

- **Presentation Layer** — React Native (Expo) mobile app; phone-based auth, wallet view, transfers, history. Talks to backend exclusively over HTTPS REST.
- **Application Layer** — Authentication, Wallet, Transaction, and Administration management modules.
- **Business Logic Layer** — User, Wallet, Transaction, Exchange Rate, and Notification services; isolates business rules from API/data concerns.
- **Data Access Layer** — Repository pattern; no direct service-to-database calls.
- **Database Layer** — PostgreSQL, single source of truth for users, wallets, transactions, exchange rates, admin records.

External services tier (isolated from the client): M-Pesa Daraja API, Orange Money API, ExchangeRate-API, Firebase Authentication — credentials never touch the mobile client.

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native (Expo SDK 50+) |
| Backend | Node.js v20 LTS + Express.js |
| Database | PostgreSQL v15+ via Prisma ORM v5+ |
| Auth | Firebase Authentication (phone/OTP) |
| Mobile money integration | M-Pesa Daraja API v2, Orange Money API |
| Currency conversion | ExchangeRate-API (free tier) |
| Testing | Jest (unit/integration), Postman (API) |
| Tooling | VS Code, Git/GitHub, Figma (wireframes) |



## 7. Sprint Plan (14-week Agile schedule)

**Phase 1 — Research, Requirements, Design (Weeks 1–4)**
- Wks 1–2: Literature review, stakeholder/requirements analysis, tech stack finalization
- Wks 3–4: Architecture diagram, ERD, use case/DFD diagrams, wireframes, API integration contracts
- Wk 4: Draft report Chapters 1–4

**Phase 2 — System Development (Weeks 5–10)**
- **Sprint 1** (Wks 5–6): Node.js/Express server setup, PostgreSQL config, Firebase Auth, security config
- **Sprint 2** (Wks 7–8): M-Pesa Daraja + Orange Money + ExchangeRate API integration, wallet management, transaction processing logic
- **Sprint 3** (Wks 9–10): React Native app build, UI/navigation, frontend↔backend integration → working MVP

**Phase 3 — Testing, Documentation, Presentation (Weeks 11–14)**
- Wks 11–12: Jest unit tests, Postman API tests, end-to-end + usability + security testing, bug fixes
- Wk 13: Finalize project report
- Wk 14: Demo prep, live demonstration, final submission

---
*Source: PanWallet academic project report (Chapters 1–5), 158 pages. This document is a condensed reference for ongoing implementation work — refer to the full report for detailed rationale, diagrams, and literature review.*
