/*
  Warnings:

  - The values [ORANGE_MONEY] on the enum `WalletProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletProvider_new" AS ENUM ('PANWALLET_INTERNAL', 'MPESA', 'MTN_MOMO');
ALTER TABLE "wallets" ALTER COLUMN "provider" TYPE "WalletProvider_new" USING ("provider"::text::"WalletProvider_new");
ALTER TABLE "transactions" ALTER COLUMN "recipientProvider" TYPE "WalletProvider_new" USING ("recipientProvider"::text::"WalletProvider_new");
ALTER TYPE "WalletProvider" RENAME TO "WalletProvider_old";
ALTER TYPE "WalletProvider_new" RENAME TO "WalletProvider";
DROP TYPE "public"."WalletProvider_old";
COMMIT;
