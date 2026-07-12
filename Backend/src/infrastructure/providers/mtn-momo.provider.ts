// src/infrastructure/providers/mtn-momo.provider.ts

import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env";
import { InternalServerError, BadRequestError } from "../../domain/error";
import { logger } from "../../config/logger";

interface MtnTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MtnRequestToPayResponse {
  referenceId: string;
}

interface MtnTransactionStatus {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  reason?: {
    code: string;
    message: string;
  };
}

interface MtnTransferResponse {
  referenceId: string;
}

interface MtnTransferStatus {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId: string;
  payee: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  reason?: {
    code: string;
    message: string;
  };
}

class MtnMomoProvider {
  private readonly baseUrl: string;
  private readonly environment: string;
  private readonly currency: string;

  // Collection credentials
  private readonly collectionSubscriptionKey: string;
  private readonly collectionApiUser: string;
  private readonly collectionApiKey: string;

  // Disbursement credentials
  private readonly disbursementSubscriptionKey: string;
  private readonly disbursementApiUser: string;
  private readonly disbursementApiKey: string;

  // Token cache — separate for each product
  private collectionToken: string | null = null;
  private collectionTokenExpiresAt: Date | null = null;
  private disbursementToken: string | null = null;
  private disbursementTokenExpiresAt: Date | null = null;

  constructor() {
    this.baseUrl = env.MTN_BASE_URL;
    this.environment = env.MTN_ENVIRONMENT;
    this.currency = env.MTN_CURRENCY;

    this.collectionSubscriptionKey = env.MTN_COLLECTION_SUBSCRIPTION_KEY;
    this.collectionApiUser = env.MTN_COLLECTION_API_USER;
    this.collectionApiKey = env.MTN_COLLECTION_API_KEY;

    this.disbursementSubscriptionKey = env.MTN_DISBURSEMENT_SUBSCRIPTION_KEY;
    this.disbursementApiUser = env.MTN_DISBURSEMENT_API_USER;
    this.disbursementApiKey = env.MTN_DISBURSEMENT_API_KEY;
  }

  // ── Private helpers ────────────────────────────────────────────

  private async getCollectionToken(): Promise<string> {
    if (
      this.collectionToken &&
      this.collectionTokenExpiresAt &&
      new Date() < this.collectionTokenExpiresAt
    ) {
      return this.collectionToken;
    }

    const credentials = Buffer.from(
      `${this.collectionApiUser}:${this.collectionApiKey}`
    ).toString("base64");

    try {
      const response = await axios.post<MtnTokenResponse>(
        `${this.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Ocp-Apim-Subscription-Key": this.collectionSubscriptionKey,
          },
        }
      );

      this.collectionToken = response.data.access_token;
      this.collectionTokenExpiresAt = new Date(
        Date.now() + (response.data.expires_in - 60) * 1000
      );

      logger.debug("MTN Collection token refreshed.");
      return this.collectionToken;
    } catch (error) {
      logger.error("MTN Collection token fetch failed:", error);
      throw new InternalServerError(
        "Failed to authenticate with MTN MoMo Collection."
      );
    }
  }

  private async getDisbursementToken(): Promise<string> {
    if (
      this.disbursementToken &&
      this.disbursementTokenExpiresAt &&
      new Date() < this.disbursementTokenExpiresAt
    ) {
      return this.disbursementToken;
    }

    const credentials = Buffer.from(
      `${this.disbursementApiUser}:${this.disbursementApiKey}`
    ).toString("base64");

    try {
      const response = await axios.post<MtnTokenResponse>(
        `${this.baseUrl}/disbursement/token/`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Ocp-Apim-Subscription-Key": this.disbursementSubscriptionKey,
          },
        }
      );

      this.disbursementToken = response.data.access_token;
      this.disbursementTokenExpiresAt = new Date(
        Date.now() + (response.data.expires_in - 60) * 1000
      );

      logger.debug("MTN Disbursement token refreshed.");
      return this.disbursementToken;
    } catch (error) {
      logger.error("MTN Disbursement token fetch failed:", error);
      throw new InternalServerError(
        "Failed to authenticate with MTN MoMo Disbursement."
      );
    }
  }

  private normalizePhone(phone: string): string {
    // MTN MoMo expects MSISDN without + sign
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("00")) return cleaned.slice(2);
    if (cleaned.startsWith("0") && cleaned.length <= 10) {
      // assume Uganda as default local format (256)
      return `256${cleaned.slice(1)}`;
    }
    return cleaned;
  }

  // ── Public methods ─────────────────────────────────────────────

  async requestToPay(
    phoneNumber: string,
    amount: number,
    externalId: string,
    payerMessage: string,
    payeeNote: string,
    callbackUrl?: string
  ): Promise<string> {
    if (amount < 1) {
      throw new BadRequestError("MTN MoMo minimum transaction amount is 1.");
    }

    const token = await this.getCollectionToken();
    const referenceId = uuidv4();
    const msisdn = this.normalizePhone(phoneNumber);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": this.environment,
      "Ocp-Apim-Subscription-Key": this.collectionSubscriptionKey,
      "Content-Type": "application/json",
    };

    if (callbackUrl) {
      headers["X-Callback-Url"] = callbackUrl;
    }

    try {
      await axios.post(
        `${this.baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: String(Math.ceil(amount)),
          currency: this.currency,
          externalId,
          payer: {
            partyIdType: "MSISDN",
            partyId: msisdn,
          },
          payerMessage,
          payeeNote,
        },
        { headers }
      );

      logger.info("MTN MoMo request to pay initiated.", {
        referenceId,
        msisdn,
        amount,
      });

      return referenceId;
    } catch (error) {
      logger.error("MTN MoMo request to pay failed:", error);
      throw new InternalServerError("Failed to initiate MTN MoMo payment request.");
    }
  }

  async getRequestToPayStatus(
    referenceId: string
  ): Promise<MtnTransactionStatus> {
    const token = await this.getCollectionToken();

    try {
      const response = await axios.get<MtnTransactionStatus>(
        `${this.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.environment,
            "Ocp-Apim-Subscription-Key": this.collectionSubscriptionKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("MTN MoMo status check failed:", error);
      throw new InternalServerError(
        "Failed to check MTN MoMo payment status."
      );
    }
  }

  async transfer(
    phoneNumber: string,
    amount: number,
    externalId: string,
    payerMessage: string,
    payeeNote: string,
    callbackUrl?: string
  ): Promise<string> {
    if (amount < 1) {
      throw new BadRequestError("MTN MoMo minimum transfer amount is 1.");
    }

    const token = await this.getDisbursementToken();
    const referenceId = uuidv4();
    const msisdn = this.normalizePhone(phoneNumber);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": this.environment,
      "Ocp-Apim-Subscription-Key": this.disbursementSubscriptionKey,
      "Content-Type": "application/json",
    };

    if (callbackUrl) {
      headers["X-Callback-Url"] = callbackUrl;
    }

    try {
      await axios.post(
        `${this.baseUrl}/disbursement/v1_0/transfer`,
        {
          amount: String(Math.ceil(amount)),
          currency: this.currency,
          externalId,
          payee: {
            partyIdType: "MSISDN",
            partyId: msisdn,
          },
          payerMessage,
          payeeNote,
        },
        { headers }
      );

      logger.info("MTN MoMo disbursement transfer initiated.", {
        referenceId,
        msisdn,
        amount,
      });

      return referenceId;
    } catch (error) {
      logger.error("MTN MoMo transfer failed:", error);
      throw new InternalServerError("Failed to initiate MTN MoMo transfer.");
    }
  }

  async getTransferStatus(referenceId: string): Promise<MtnTransferStatus> {
    const token = await this.getDisbursementToken();

    try {
      const response = await axios.get<MtnTransferStatus>(
        `${this.baseUrl}/disbursement/v1_0/transfer/${referenceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": this.environment,
            "Ocp-Apim-Subscription-Key": this.disbursementSubscriptionKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("MTN MoMo transfer status check failed:", error);
      throw new InternalServerError(
        "Failed to check MTN MoMo transfer status."
      );
    }
  }

  async getAccountBalance(): Promise<{
    availableBalance: string;
    currency: string;
  }> {
    const token = await this.getCollectionToken();

    try {
      const response = await axios.get<{
        availableBalance: string;
        currency: string;
      }>(`${this.baseUrl}/collection/v1_0/account/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Target-Environment": this.environment,
          "Ocp-Apim-Subscription-Key": this.collectionSubscriptionKey,
        },
      });

      return response.data;
    } catch (error) {
      logger.error("MTN MoMo balance check failed:", error);
      throw new InternalServerError("Failed to fetch MTN MoMo account balance.");
    }
  }
}

export const mtnMomoProvider = new MtnMomoProvider();