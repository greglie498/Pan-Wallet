export enum WalletProvider {
    PANWALLET_INTERNAL = "PANWALLET_INTERNAL",
    MPESA = "MPESA",
    ORANGE_MONEY = "ORANGE_MONEY",
}

export enum WalletStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    CLOSED = "CLOSED",
}

export enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REVERSED = "REVERSED",
}

export enum UserStatus{
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    DELETED = "DELETED",
}