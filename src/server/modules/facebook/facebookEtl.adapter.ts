import type {
    BreakdownDimension,
    EntityLevel,
    NormalizedAd,
    NormalizedAdSet,
    NormalizedBreakdownInsight,
    NormalizedCampaignRef,
    NormalizedInsight,
    NormalizedInsightMetrics,
    NormalizedPost,
} from "@/server/core/etl/etl.types";
import { FACEBOOK_BREAKDOWN_FIELD, type FacebookEntityRow, type FacebookInsightRow, type FacebookPostRow } from "./facebookEtl.repository";

const PLATFORM_CODE = "META" as const;

export function normalizeFacebookCampaign(row: FacebookEntityRow): NormalizedCampaignRef {
    return { platformCode: PLATFORM_CODE, externalCampaignId: row.id, name: row.name, status: row.status };
}

export function normalizeFacebookAdSet(row: FacebookEntityRow): NormalizedAdSet {
    return {
        platformCode: PLATFORM_CODE,
        externalAdSetId: row.id,
        externalCampaignId: row.campaign_id ?? "",
        name: row.name,
        status: row.status,
    };
}

export function normalizeFacebookAd(row: FacebookEntityRow): NormalizedAd {
    return {
        platformCode: PLATFORM_CODE,
        externalAdId: row.id,
        externalAdSetId: row.adset_id ?? "",
        externalCampaignId: row.campaign_id ?? "",
        name: row.name,
        status: row.status,
        creativeId: row.creative?.id,
    };
}

export function normalizeFacebookPost(row: FacebookPostRow): NormalizedPost {
    return {
        platformCode: PLATFORM_CODE,
        externalPostId: row.id,
        message: row.message,
        permalink: row.permalink_url,
        publishedAt: row.created_time ? new Date(row.created_time) : undefined,
        likeCount: row.likes?.summary?.total_count,
        commentCount: row.comments?.summary?.total_count,
        shareCount: row.shares?.count,
    };
}

// Facebook's "conversion" is pixel-setup-dependent per company (which
// action_type counts). Rather than guess one, sum across all reported actions
// and keep the full breakdown in `raw` so the dashboard layer can pick the
// right action_type per company later without a re-pull.
function toMetrics(row: FacebookInsightRow): NormalizedInsightMetrics {
    const sumActionValues = (actions?: { value: string }[]) => (actions ?? []).reduce((sum, action) => sum + Number(action.value ?? 0), 0);

    return {
        impressions: row.impressions !== undefined ? Number(row.impressions) : undefined,
        clicks: row.clicks !== undefined ? Number(row.clicks) : undefined,
        spend: row.spend !== undefined ? Number(row.spend) : undefined,
        reach: row.reach !== undefined ? Number(row.reach) : undefined,
        frequency: row.frequency !== undefined ? Number(row.frequency) : undefined,
        ctr: row.ctr !== undefined ? Number(row.ctr) : undefined,
        cpc: row.cpc !== undefined ? Number(row.cpc) : undefined,
        cpm: row.cpm !== undefined ? Number(row.cpm) : undefined,
        conversions: row.actions ? sumActionValues(row.actions) : undefined,
        conversionsValue: row.action_values ? sumActionValues(row.action_values) : undefined,
        raw: { actions: row.actions, action_values: row.action_values },
    };
}

const ENTITY_ID_KEY: Record<EntityLevel, "campaign_id" | "adset_id" | "ad_id"> = {
    CAMPAIGN: "campaign_id",
    ADSET: "adset_id",
    AD: "ad_id",
};

export function normalizeFacebookInsight(row: FacebookInsightRow, entityLevel: EntityLevel, date: Date): NormalizedInsight | null {
    const externalEntityId = row[ENTITY_ID_KEY[entityLevel]] as string | undefined;
    const externalCampaignId = row.campaign_id;
    if (!externalEntityId || !externalCampaignId) return null;

    return { platformCode: PLATFORM_CODE, entityLevel, externalEntityId, externalCampaignId, date, metrics: toMetrics(row) };
}

export function normalizeFacebookBreakdownInsight(
    row: FacebookInsightRow,
    dimension: BreakdownDimension,
    date: Date,
): NormalizedBreakdownInsight | null {
    const externalCampaignId = row.campaign_id;
    if (!externalCampaignId) return null;

    const dimensionValue = row[FACEBOOK_BREAKDOWN_FIELD[dimension]];
    if (typeof dimensionValue !== "string") return null;

    return {
        platformCode: PLATFORM_CODE,
        entityLevel: "CAMPAIGN",
        externalEntityId: externalCampaignId,
        externalCampaignId,
        date,
        dimensionType: dimension,
        dimensionValue,
        metrics: toMetrics(row),
    };
}
