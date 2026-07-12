import axios from "axios";
import { env } from "../../config/env";
import { InternalServerError } from "../../domain/error";
import { logger } from "../../config/logger";



interface ExchangeRateApiResponse {
    result: string;
    base_code: string;
    conversion_rates: Record<string, number>;
}

class ExchangeRateProvider {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.baseUrl = env.EXCHANGE_RATE_BASE_URL;
        this.apiKey = env.EXCHANGE_RATE_API_KEY;
    }

    async getRate (
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<number> {
        try{
            const url = `${this.baseUrl}/${this.apiKey}/latest/${sourceCurrency}`;

            const response = await axios.get<ExchangeRateApiResponse>(url);

            if (response.data.result !== "success") {
                throw new InternalServerError(
                    `Exchange rate API returned non-success result.`
                );
            }

            const rate = response.data.conversion_rates[targetCurrency];

            if (rate === undefined) {
                throw new InternalServerError(
                    `Exchange rate not found for ${sourceCurrency} -> ${targetCurrency}.`
                );
            }

            logger.debug(
                `Exchange rate fetched: 1 ${sourceCurrency} = ${rate} ${targetCurrency}`
            );

            return rate;
        } catch (error) {
            if (error instanceof InternalServerError) throw error;

            logger.error("Exchange rate fetch failed: ", error);
            throw new InternalServerError("failed to fetch exchange rate. Please try again.");
        }
    }

    async convert(
        amount: number,
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<{ rate: number, convertedAmount: number}> {
        if (sourceCurrency === targetCurrency) {
            return { rate: 1, convertedAmount: amount};
        }

        const rate = await this.getRate(sourceCurrency, targetCurrency);
        const convertedAmount = Math.round(amount * rate * 100) / 100;

        return { rate, convertedAmount };
    }
}

export const exchangeRateProvider = new ExchangeRateProvider();
