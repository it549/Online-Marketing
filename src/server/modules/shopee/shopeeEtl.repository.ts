import { shopeeShopGet, type ShopeeApiEnvelope } from "./shopeeApiPerformance.service";

const MAX_CAMPAIGNS_PER_REQUEST = 100;

export interface ShopeeCampaignIdEntry {
    ad_type: string;
    campaign_id: number;
}

export interface ShopeeCampaignMetricsPoint {
    expense: number;
    broad_gmv: number;
    broad_order: number;
}

export interface ShopeeCampaignPerformance {
    campaign_id: number;
    ad_type: string;
    ad_name: string;
    metrics_list: ShopeeCampaignMetricsPoint[];
}

/** Shopee's ads APIs take dates as DD-MM-YYYY, unlike the order API's unix timestamps. */
export function formatShopeeAdsDate(date: Date): string {
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

/** Narrows the same shop-level daily-performance endpoint the dashboard uses to a single target date. */
export async function getShopeeCampaignPerformanceForDate(
    shopId: string,
    accessToken: string,
    date: Date,
): Promise<ShopeeCampaignPerformance[]> {
    const dateParams = { start_date: formatShopeeAdsDate(date), end_date: formatShopeeAdsDate(date) };

    const campaignIdList = await shopeeShopGet("/api/v2/ads/get_product_level_campaign_id_list", shopId, accessToken, {
        ad_type: "all",
        offset: "0",
        limit: String(MAX_CAMPAIGNS_PER_REQUEST),
    });
    const campaignEntries =
        ((campaignIdList.response as { campaign_list?: ShopeeCampaignIdEntry[] } | undefined)?.campaign_list) ?? [];

    if (campaignEntries.length === 0) return [];

    const campaignPerformance: ShopeeApiEnvelope = await shopeeShopGet(
        "/api/v2/ads/get_product_campaign_daily_performance",
        shopId,
        accessToken,
        { ...dateParams, campaign_id_list: campaignEntries.map((entry) => entry.campaign_id).join(",") },
    );

    const shopBlocks =
        (campaignPerformance.response as unknown as { campaign_list?: ShopeeCampaignPerformance[] }[] | undefined) ?? [];
    return shopBlocks.flatMap((block) => block.campaign_list ?? []);
}
