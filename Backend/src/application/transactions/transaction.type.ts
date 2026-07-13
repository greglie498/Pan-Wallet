export interface InitiateTransferInput {
    senderWalletId: string;
    recipientProvider: string;
    recipientNumber: string;
    amount: number;
    description?: string;
    callbackUrl?: string;
}

export interface TransferQuote {
    senderWalletId: string;
    senderCurrency: string;
    recipientProvider: string;
    recipientNumber: string;
    amount: number;
    convertedAmount: number;
    exchangeRate: number;
    fee: number;
    totalDeducted: number;
    recipientCurrency: string;
}

export interface TransferResult {
    transactionId: string;
    status: string;
    providerReferenceId: string;
    quote: TransferQuote;
    message: string;
}

export interface CallbackResult {
    providerReferenceId: string;
    success: boolean;
    failureReason?: string;
}