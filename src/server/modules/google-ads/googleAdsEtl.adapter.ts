import type { NormalizedAdSet, NormalizedCampaignRef, NormalizedInsight, NormalizedInsightMetrics } from "@/server/core/etl/etl.types";
import type { GoogleAdsAdGroupRow, GoogleAdsCampaignRow, GoogleAdsMetricsRow } from "./googleAdsEtl.repository";

const PLATFORM_CODE = "GOOGLE_ADS" as const;

function toNumber(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined) return undefined;
    return typeof value === "string" ? Number(value) : value;
}

function toMetrics(metrics: GoogleAdsMetricsRow | null | undefined): NormalizedInsightMetrics {
    const costMicros = toNumber(metrics?.cost_micros);
    const avgCpcMicros = toNumber(metrics?.average_cpc);

    return {
        impressions: toNumber(metrics?.impressions),
        clicks: toNumber(metrics?.clicks),
        spend: costMicros !== undefined ? costMicros / 1_000_000 : undefined,
        ctr: toNumber(metrics?.ctr),
        cpc: avgCpcMicros !== undefined ? avgCpcMicros / 1_000_000 : undefined,
        conversions: toNumber(metrics?.conversions),
        conversionsValue: toNumber(metrics?.conversions_value),
        raw: metrics ? { ...metrics } : undefined,
    };
}

export function normalizeGoogleCampaign(row: GoogleAdsCampaignRow): NormalizedCampaignRef | null {
    const id = row.campaign?.id;
    if (id === undefined || id === null) return null;
    return { platformCode: PLATFORM_CODE, externalCampaignId: String(id), name: row.campaign?.name ?? "", status: row.campaign?.status ?? "" };
}

// Google's "ad group" maps to this schema's AdSet tier.
export function normalizeGoogleAdGroup(row: GoogleAdsAdGroupRow): NormalizedAdSet | null {
    const adGroupId = row.ad_group?.id;
    const campaignId = row.campaign?.id;
    if (adGroupId === undefined || adGroupId === null || campaignId === undefined || campaignId === null) return null;

    return {
        platformCode: PLATFORM_CODE,
        externalAdSetId: String(adGroupId),
        externalCampaignId: String(campaignId),
        name: row.ad_group?.name ?? "",
        status: row.ad_group?.status ?? "",
    };
}

export function normalizeGoogleCampaignInsight(row: GoogleAdsCampaignRow, date: Date): NormalizedInsight | null {
    const id = row.campaign?.id;
    if (id === undefined || id === null) return null;

    return { platformCode: PLATFORM_CODE, entityLevel: "CAMPAIGN", externalEntityId: String(id), externalCampaignId: String(id), date, metrics: toMetrics(row.metrics) };
}

export function normalizeGoogleAdGroupInsight(row: GoogleAdsAdGroupRow, date: Date): NormalizedInsight | null {
    const adGroupId = row.ad_group?.id;
    const campaignId = row.campaign?.id;
    if (adGroupId === undefined || adGroupId === null || campaignId === undefined || campaignId === null) return null;

    return {
        platformCode: PLATFORM_CODE,
        entityLevel: "ADSET",
        externalEntityId: String(adGroupId),
        externalCampaignId: String(campaignId),
        date,
        metrics: toMetrics(row.metrics),
    };
}
