export type TokenHealthStatus = "ok" | "expiring" | "expired" | "invalid" | "unknown";

export interface TokenHealth {
    label: string;
    companyId: string | null;
    status: TokenHealthStatus;
    expiresAt: string | null;
    daysLeft: number | null;
    message: string;
}
