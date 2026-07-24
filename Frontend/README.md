# PanWallet Mobile App

Expo Router / React Native client for PanWallet. It supports user and administrator authentication, wallet management, top-ups, transfer quote and confirmation, transaction history, and theme selection.

## Prerequisites

- Node.js 22.13 or later (Expo SDK 57)
- An Android emulator, iOS simulator, or physical device
- A running PanWallet backend

## Setup

```powershell
npm install
Set-Content .env 'EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1'
npx expo start
```

Replace the URL for a physical device with your computer's LAN IP address, for example `http://192.168.1.20:4000/api/v1`. Do not use a temporary tunnel URL as a default configuration.

## Commands

| Command | Description |
| --- | --- |
| `npm start` | Open the Expo development server. |
| `npm run android` | Build/run on Android. |
| `npm run ios` | Build/run on iOS. |
| `npm run web` | Run the web target. |
| `npm run lint` | Run Expo linting. |

## App flow

1. Register or sign in.
2. View the dashboard and linked wallets.
3. Select **Send**, choose a provider, enter the recipient and amount, then fetch a quote.
4. Review the recipient amount, exchange rate, fee, and total debit before confirming.
5. Track pending, completed, failed, and reversed transfers in History.

Tokens are stored with Expo SecureStore. Set `EXPO_PUBLIC_API_URL` explicitly for every environment.
