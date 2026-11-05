import type { NormalizedCampaignRef, NormalizedInsight } from "@/server/core/etl/etl.types";
import type { ShopeeCampaignPerformance } from "./shopeeEtl.repository";

const PLATFORM_CODE = "SHOPEE" as const;

function sum(points: { expense?: number; broad_gmv?: number; broad_order?: number }[], key: "expense" | "broad_gmv" | "broad_order"): number {
    return points.reduce((total, point) => total + (point[key] ?? 0), 0);
}

export function normalizeShopeeCampaignRef(row: ShopeeCampaignPerformance): NormalizedCampaignRef {
    return {
        platformCode: PLATFORM_CODE,
        externalCampaignId: String(row.campaign_id),
        name: row.ad_name || `แคมเปญ #${row.campaign_id}`,
        // Shopee's daily-performance endpoint doesn't return a campaign status field --
        // any campaign it lists is one that had activity, so ACTIVE is the closest fit.
        status: "ACTIVE",
    };
}

export function normalizeShopeeCampaignInsight(row: ShopeeCampaignPerformance, date: Date): NormalizedInsight {
    const externalCampaignId = String(row.campaign_id);
    const spend = sum(row.metrics_list, "expense");
    const gmv = sum(row.metrics_list, "broad_gmv");
    const orders = sum(row.metrics_list, "broad_order");

    return {
        platformCode: PLATFORM_CODE,
        entityLevel: "CAMPAIGN",
        externalEntityId: externalCampaignId,
        externalCampaignId,
        date,
        metrics: { spend, conversions: orders, conversionsValue: gmv, raw: { ad_type: row.ad_type } },
    };
}
