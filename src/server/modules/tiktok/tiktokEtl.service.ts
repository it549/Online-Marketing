import type { Company } from "@prisma/client";
import { saveEtlSyncResult } from "@/server/core/etl/etl-database.service";
import { formatDateParam } from "@/server/core/etl/etlDate.util";
import type { NormalizedEtlSyncResult, PlatformSyncResult } from "@/server/core/etl/etl.types";
import type { TikTokCredentials } from "./tiktokEtl.repository";
import { getTikTokAdGroups, getTikTokAds, getTikTokCampaigns, getTikTokReport } from "./tiktokEtl.repository";
import { normalizeTikTokAd, normalizeTikTokAdGroup, normalizeTikTokCampaign, normalizeTikTokInsight } from "./tiktokEtl.adapter";

function resolveTikTokCredentials(company: Company): TikTokCredentials | null {
    if (!company.tiktokAdvertiserId || !company.tiktokAccessToken) return null;
    return { advertiserId: company.tiktokAdvertiserId, accessToken: company.tiktokAccessToken };
}

// TikTok has no App ID/Secret provisioned anywhere in this deployment yet, so
// this always skips even when a company has credentials stored -- the
// repository layer is fully shaped for the real API but every call
// short-circuits to []. Activating TikTok later only touches
// tiktokEtl.repository.ts's fetch bodies; no orchestrator/schema change needed.
export async function syncTikTokAdsForCompany(
    company: Company,
    targetDate: Date,
    options: { dryRun?: boolean } = {},
): Promise<PlatformSyncResult> {
    const credentials = resolveTikTokCredentials(company);
    if (!credentials) return { status: "skipped", reason: "not_connected" };

    const dateParam = formatDateParam(targetDate);

    const [campaignRows, adGroupRows, adRows] = await Promise.all([
        getTikTokCampaigns(credentials),
        getTikTokAdGroups(credentials),
        getTikTokAds(credentials),
    ]);

    if (campaignRows.length === 0 && adGroupRows.length === 0 && adRows.length === 0) {
        return { status: "skipped", reason: "api_client_not_wired" };
    }

    const [campaignReport, adGroupReport, adReport] = await Promise.all([
        getTikTokReport(credentials, "CAMPAIGN", dateParam),
        getTikTokReport(credentials, "ADGROUP", dateParam),
        getTikTokReport(credentials, "AD", dateParam),
    ]);

    const result: NormalizedEtlSyncResult = {
        platformCode: "TIKTOK",
        syncDate: targetDate,
        campaigns: campaignRows.map(normalizeTikTokCampaign),
        adSets: adGroupRows.map(normalizeTikTokAdGroup),
        ads: adRows.map(normalizeTikTokAd),
        posts: [],
        insights: [
            ...campaignReport.map((row) => normalizeTikTokInsight(row, "CAMPAIGN", targetDate)),
            ...adGroupReport.map((row) => normalizeTikTokInsight(row, "ADSET", targetDate)),
            ...adReport.map((row) => normalizeTikTokInsight(row, "AD", targetDate)),
        ].filter((insight): insight is NonNullable<typeof insight> => insight !== null),
        breakdowns: [],
    };

    return saveEtlSyncResult(company.id, result, options);
}
