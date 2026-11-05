import type { Company } from "@prisma/client";

export interface FacebookCredentials {
    adAccountId: string;
    accessToken: string;
}

export function resolveFacebookCredentials(company: Company): FacebookCredentials | null {
    if (!company.facebookAdAccountId || !company.facebookAccessToken) return null;
    return { adAccountId: company.facebookAdAccountId, accessToken: company.facebookAccessToken };
}

// No refresh flow exists for Facebook in this codebase (long-lived token
// assumed) -- callers should skip the sync rather than fail when this is true.
export function isFacebookTokenExpired(company: Company, now: Date = new Date()): boolean {
    if (!company.facebookTokenExpiresAt) return false;
    return company.facebookTokenExpiresAt.getTime() <= now.getTime();
}
