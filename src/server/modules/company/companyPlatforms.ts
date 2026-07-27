import type { CompanyPlatformId } from "@/types/company";

export const DEFAULT_COMPANY_PLATFORMS: CompanyPlatformId[] = ["facebook", "shopee", "tiktok"];

const VALID_PLATFORMS: readonly CompanyPlatformId[] = ["facebook", "shopee", "tiktok", "googleAds"];

function isCompanyPlatformId(value: unknown): value is CompanyPlatformId {
    return typeof value === "string" && (VALID_PLATFORMS as readonly string[]).includes(value);
}

/** `Company.platforms` is a raw Prisma JSON value; unset/malformed rows fall back to the legacy default set. */
export function parseCompanyPlatforms(raw: unknown): CompanyPlatformId[] {
    if (!Array.isArray(raw)) return DEFAULT_COMPANY_PLATFORMS;

    const filtered = raw.filter(isCompanyPlatformId);
    return filtered.length > 0 ? filtered : DEFAULT_COMPANY_PLATFORMS;
}
