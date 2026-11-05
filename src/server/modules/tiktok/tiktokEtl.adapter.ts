import type { EntityLevel, NormalizedAd, NormalizedAdSet, NormalizedCampaignRef, NormalizedInsight, NormalizedInsightMetrics } from "@/server/core/etl/etl.types";
import type { TikTokAdGroupRow, TikTokAdRow, TikTokCampaignRow, TikTokReportRow } from "./tiktokEtl.repository";

const PLATFORM_CODE = "TIKTOK" as const;

export function normalizeTikTokCampaign(row: TikTokCampaignRow): NormalizedCampaignRef {
    return { platformCode: PLATFORM_CODE, externalCampaignId: row.campaign_id, name: row.campaign_name, status: row.operation_status };
}

export function normalizeTikTokAdGroup(row: TikTokAdGroupRow): NormalizedAdSet {
    return {
        platformCode: PLATFORM_CODE,
        externalAdSetId: row.adgroup_id,
        externalCampaignId: row.campaign_id,
        name: row.adgroup_name,
        status: row.operation_status,
    };
}

export function normalizeTikTokAd(row: TikTokAdRow): NormalizedAd {
    return {
        platformCode: PLATFORM_CODE,
        externalAdId: row.ad_id,
        externalAdSetId: row.adgroup_id,
        externalCampaignId: row.campaign_id,
        name: row.ad_name,
        status: row.operation_status,
    };
}

function toNumber(value: string | undefined): number | undefined {
    return value !== undefined ? Number(value) : undefined;
}

function toMetrics(metrics: TikTokReportRow["metrics"]): NormalizedInsightMetrics {
    return {
        impressions: toNumber(metrics.impressions),
        clicks: toNumber(metrics.clicks),
        spend: toNumber(metrics.spend),
        reach: toNumber(metrics.reach),
        frequency: toNumber(metrics.frequency),
        ctr: toNumber(metrics.ctr),
        cpc: toNumber(metrics.cpc),
        cpm: toNumber(metrics.cpm),
        conversions: toNumber(metrics.conversion),
        conversionsValue: toNumber(metrics.conversion_value),
        raw: { ...metrics },
    };
}

const ENTITY_ID_KEY: Record<EntityLevel, "campaign_id" | "adgroup_id" | "ad_id"> = {
    CAMPAIGN: "campaign_id",
    ADSET: "adgroup_id",
    AD: "ad_id",
};

export function normalizeTikTokInsight(row: TikTokReportRow, entityLevel: EntityLevel, date: Date): NormalizedInsight | null {
    const externalEntityId = row.dimensions[ENTITY_ID_KEY[entityLevel]];
    const externalCampaignId = row.dimensions.campaign_id;
    if (!externalEntityId || !externalCampaignId) return null;

    return { platformCode: PLATFORM_CODE, entityLevel, externalEntityId, externalCampaignId, date, metrics: toMetrics(row.metrics) };
}
