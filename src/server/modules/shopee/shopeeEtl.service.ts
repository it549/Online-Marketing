import type { Company } from "@prisma/client";
import { saveEtlSyncResult } from "@/server/core/etl/etl-database.service";
import type { NormalizedEtlSyncResult, PlatformSyncResult } from "@/server/core/etl/etl.types";
import { ensureValidAccessToken, type ShopeeCredentials } from "./shopeeAuth.service";
import { getShopeeCampaignPerformanceForDate } from "./shopeeEtl.repository";
import { normalizeShopeeCampaignInsight, normalizeShopeeCampaignRef } from "./shopeeEtl.adapter";

function resolveShopeeCredentials(company: Company): ShopeeCredentials | null {
    if (!company.shopeeShopId || !company.shopeeAccessToken || !company.shopeeRefreshToken) return null;
    return {
        companyId: company.id,
        shopId: company.shopeeShopId,
        accessToken: company.shopeeAccessToken,
        refreshToken: company.shopeeRefreshToken,
        expiresAt: company.shopeeTokenExpiresAt,
    };
}

// Campaign-level only -- Shopee's Ads API has no ad-set/ad hierarchy, so
// adSets/ads/breakdowns stay empty for this platform.
export async function syncShopeeAdsForCompany(
    company: Company,
    targetDate: Date,
    options: { dryRun?: boolean } = {},
): Promise<PlatformSyncResult> {
    const credentials = resolveShopeeCredentials(company);
    if (!credentials) return { status: "skipped", reason: "not_connected" };

    let campaignRows;
    try {
        const accessToken = await ensureValidAccessToken(credentials);
        campaignRows = await getShopeeCampaignPerformanceForDate(credentials.shopId, accessToken, targetDate);
    } catch (error) {
        return { status: "failed", reason: error instanceof Error ? error.message : String(error) };
    }

    const result: NormalizedEtlSyncResult = {
        platformCode: "SHOPEE",
        syncDate: targetDate,
        campaigns: campaignRows.map(normalizeShopeeCampaignRef),
        adSets: [],
        ads: [],
        posts: [],
        insights: campaignRows.map((row) => normalizeShopeeCampaignInsight(row, targetDate)),
        breakdowns: [],
    };

    return saveEtlSyncResult(company.id, result, options);
}
