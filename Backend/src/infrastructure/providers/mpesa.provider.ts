import axios from "axios";
import { env } from "../../config/env";
import { InternalServerError, BadRequestError } from "../../domain/error";
import { logger } from "../../config/logger";
import { buffer } from "node:stream/consumers";
import { response } from "express";

interface MpesaAccessTokenResponse {
    access_token: string,
    expires_in: string
}

interface StkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

interface StkQueryResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: string;
    ResultDesc: string; 
}

interface MpesaCallbackBody {
    Body: {
        stkCallback: {
            MerchantRequestID: string;
            CheckoutRequestID: string;
            ResultCode: number;
            ResultDesc: string;
            CallBackMetadata?: {
                Item: Array<{ Name: string; Value?: string | number }>;
            };
        };
    };
}

class MpesaProvider {
    private readonly baseUrl: string;
    private readonly shortcode: string;
    private readonly passkey: string;
    private readonly consumerKey: string;
    private readonly consumerSecret: string;

    //Token cache
    private accessToken: string | null = null;
    private tokenExpiresAt: Date | null = null;

    constructor() {
        this.baseUrl = env.MPESA_BASE_URL;
        this.shortcode = env.MPESA_SHORTCODE;
        this.passkey = env.MPESA_PASSKEY;
        this.consumerKey = env.MPESA_CONSUMER_KEY;
        this.consumerSecret = env.MPESA_CONSUMER_SECRET;
    }

    //---- Private helpers --------------------------------------------------------------------------------------------------------------------

    private async getAccessToken(): Promise<string> {
        // Return cached token if still available
        if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        const credentials = Buffer.from(
            `${this.consumerKey}:${this.consumerSecret}`
        ).toString("base64");

        try {
            const response = await axios.get<MpesaAccessTokenResponse>(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: { Authorization: `Basic ${credentials}` },
                }
            );

            if (!response.data?.access_token || !response.data?.expires_in) {
                throw new InternalServerError("Invalid Mpesa token response");
            }

            this.accessToken = response.data.access_token;
            // expires_in is in seconds - subtract 60s buffer
            this.tokenExpiresAt = new Date(
                Date.now() + (Number(response.data.expires_in) - 60) * 1000
            );

            return this.accessToken;
        } catch (error) {
            logger.error("M-Pesa token fetch failed", { error });
            throw new InternalServerError("Failed to authenticate with M-Pesa.");
        }
    }

    private generatePassword(): { password: string; timestamp: string } {
        const timestamp = new Date()
            .toISOString()
            .replace(/[^0-9]/g, "")
            .slice(0,14);

        const password = Buffer.from(
            `${this.shortcode}${this.passkey}${timestamp}`
        ).toString("base64");

        return { password, timestamp };
    }

    private normalizePhone(phone: string): string {
        // Convert +254712345678 or 0712345678 to 254712345678
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0")) {
            return `254${cleaned.slice(1)}`;
        }
        if (cleaned.startsWith("+")) {
            return cleaned.slice(1);
        }
        return cleaned;
    }

    //------ Public methods --------------------------------------------------------------------------------------------------

    async initiateStkPush (
        phoneNumber: string,
        amount: number,
        accountReference: string,
        transactionDesc: string,
        callbackUrl: string
    ): Promise<StkPushResponse> {
        const token = await this.getAccessToken();
        const { password, timestamp } = this.generatePassword();
        const normalizedPhone = this.normalizePhone(phoneNumber);

        if (amount < 1) {
            throw new BadRequestError("M-Pesa minimum transaction amount is KES 1. ");
        }

        try {
            const response = await axios.post<StkPushResponse>(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                {
                    BusinessShortCode: this.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: Math.ceil(amount),
                    PartyA: normalizedPhone,
                    PartyB: this.shortcode,
                    PhoneNumber: normalizedPhone,
                    CallBackUrl: callbackUrl,
                    AccountReference: accountReference,
                    TransactionDesc: transactionDesc,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.ResponseCode !== "0") {
                throw new InternalServerError(
                    `STK push failed: ${response.data.ResponseDescription}`
                );
            }

            logger.info(`STK push initiated for ${normalizedPhone}`, {
                merchantrequestId: response.data.MerchantRequestID,
                checkoutRequestId: response.data.CheckoutRequestID,
            });

            return response.data;
        } catch (error) {
            if (error instanceof InternalServerError || error instanceof BadRequestError ) {
                throw error;
            }
            logger.error("STK push request failed:", error);
            throw new InternalServerError("Failed to initiate M-Pesa payment");
        }
    }

    async queryStkStatus(checkoutRequestId: string): Promise<StkQueryResponse> {
        const token = await this.getAccessToken();
        const { password, timestamp } = this.generatePassword();

        try {
            const response = await axios.post<StkQueryResponse>(
                `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                {
                    BusinessShortCode: this.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: checkoutRequestId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",  
                    },
                }
            );

            return response.data;
        }catch (error) {
            logger.error("STK status query failed:", error);
            throw new InternalServerError("Failed to query M-Pesa payment status.");
        }
    }

    parseCallback(body: MpesaCallbackBody): {
        success: boolean,
        checkoutRequestId: string;
        resultDesc: string;
        amount?: number;
        mpesaReceiptNumber?: string;
        transactionDate?: string;
    } {
        const callback = body.Body.stkCallback;
        const success = callback.ResultCode === 0;

        if (!success) {
            return {
                success: false,
                checkoutRequestId: callback.CheckoutRequestID,
                resultDesc: callback.ResultDesc,
            };
        }

        //Extract metadata items when payment succeeded
        const items = callback.CallBackMetadata?.Item ?? [];

        const getValue = (name: string): string | number | undefined =>
            items.find((item) => item.Name === name)?.Value;

        return {
            success: true,
            checkoutRequestId: callback.CheckoutRequestID,
            resultDesc: callback.ResultDesc,
            amount: getValue("Amount") as number | undefined,
            mpesaReceiptNumber: getValue("MpesaReceiptNumber") as string | undefined,
            transactionDate: getValue("TransactionDate") as string | undefined,
        };
    }
}

export const mpesaProvider = new MpesaProvider();