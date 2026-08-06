import type { Company } from "@prisma/client";
import { saveEtlSyncResult } from "@/server/core/etl/etl-database.service";
import { formatDateParam } from "@/server/core/etl/etlDate.util";
import type { NormalizedEtlSyncResult, PlatformSyncResult } from "@/server/core/etl/etl.types";
import type { GoogleAdsCredentials } from "@/types/googleAds";
import { getGoogleAdsAdGroupDaily, getGoogleAdsCampaignDaily } from "./googleAdsEtl.repository";
import {
    normalizeGoogleAdGroup,
    normalizeGoogleAdGroupInsight,
    normalizeGoogleCampaign,
    normalizeGoogleCampaignInsight,
} from "./googleAdsEtl.adapter";

function resolveGoogleAdsCredentials(company: Company): GoogleAdsCredentials | null {
    if (!company.googleAdsCustomerId || !company.googleAdsRefreshToken) return null;
    return { customerId: company.googleAdsCustomerId, refreshToken: company.googleAdsRefreshToken };
}

// No token-refresh-and-persist step needed here (unlike Facebook/Shopee): the
// google-ads-api SDK exchanges the stored refresh token internally on every
// call, and Google refresh tokens don't expire on a schedule, only on revocation.
export async function syncGoogleAdsForCompany(
    company: Company,
    targetDate: Date,
    options: { dryRun?: boolean } = {},
): Promise<PlatformSyncResult> {
    const credentials = resolveGoogleAdsCredentials(company);
    if (!credentials) return { status: "skipped", reason: "not_connected" };

    const dateParam = formatDateParam(targetDate);

    let campaignRows, adGroupRows;
    try {
        [campaignRows, adGroupRows] = await Promise.all([
            getGoogleAdsCampaignDaily(credentials, dateParam),
            getGoogleAdsAdGroupDaily(credentials, dateParam),
        ]);
    } catch (error) {
        return { status: "failed", reason: error instanceof Error ? error.message : String(error) };
    }

    const result: NormalizedEtlSyncResult = {
        platformCode: "GOOGLE_ADS",
        syncDate: targetDate,
        campaigns: campaignRows.map(normalizeGoogleCampaign).filter((c): c is NonNullable<typeof c> => c !== null),
        adSets: adGroupRows.map(normalizeGoogleAdGroup).filter((a): a is NonNullable<typeof a> => a !== null),
        ads: [],
        posts: [],
        insights: [
            ...campaignRows.map((row) => normalizeGoogleCampaignInsight(row, targetDate)),
            ...adGroupRows.map((row) => normalizeGoogleAdGroupInsight(row, targetDate)),
        ].filter((insight): insight is NonNullable<typeof insight> => insight !== null),
        breakdowns: [],
    };

    return saveEtlSyncResult(company.id, result, options);
}
