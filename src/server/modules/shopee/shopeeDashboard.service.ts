import { toNumber } from "@/utils/decimal";
import {
    ShopeeAvailableFilters, ShopeeDashboardFilters, ShopeeDashboardResponse, ShopeePeriodGranularity,
} from "@/types/shopeeDashboard";
import { getShopeeAvailableFiltersRepository, getShopeeCampaignsRepository } from "./shopeeDashboard.repository";
import { getBucketKey, getBucketRange, ShopeeBucketAccumulator } from "./shopeeDashboard.bucket";
import { mapShopeeDashboard } from "./shopeeDashboard.mapper";

export async function getShopeeDashboardData(
    granularity: ShopeePeriodGranularity,
    filters: ShopeeDashboardFilters,
): Promise<ShopeeDashboardResponse> {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined;

    const [repoResult, availableCampaigns] = await Promise.all([
        getShopeeCampaignsRepository({
            productId: filters.productId,
            campaignName: filters.campaignName,
            status: filters.status,
            dateFrom,
            dateTo,
        }),
        getShopeeAvailableFiltersRepository(),
    ]);

    const availableFilters = buildAvailableFilters(availableCampaigns);
    const hasData = availableCampaigns.length > 0;

    if (!repoResult) {
        return mapShopeeDashboard({ hasData: false, granularity, buckets: [] }, availableFilters);
    }

    const buckets = new Map<string, ShopeeBucketAccumulator>();

    for (const campaign of repoResult.campaigns) {
        for (const metric of campaign.reportMetrics) {
            const range = getBucketRange(granularity, metric.reportStartDate);
            const key = getBucketKey(range);

            const existing = buckets.get(key) ?? {
                periodStart: range.start,
                periodEnd: range.end,
                spend: 0,
                revenue: 0,
                orders: 0,
                clicks: 0,
                impressions: 0,
            };

            existing.spend += toNumber(metric.spend);
            existing.revenue += toNumber(metric.revenue);
            existing.orders += metric.orders ?? 0;
            existing.clicks += metric.clicks ?? 0;
            existing.impressions += metric.impressions ?? 0;

            buckets.set(key, existing);
        }
    }

    const sortedBuckets = Array.from(buckets.values()).sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

    return mapShopeeDashboard({ hasData, granularity, buckets: sortedBuckets }, availableFilters);
}

function buildAvailableFilters(campaigns: { productId: string | null; campaignName: string; campaignStatus: string }[]): ShopeeAvailableFilters {
    const products = new Map<string, string>();
    const campaignNames = new Set<string>();
    const statuses = new Set<string>();

    for (const campaign of campaigns) {
        if (campaign.productId) {
            products.set(campaign.productId, campaign.campaignName);
        }

        campaignNames.add(campaign.campaignName);
        statuses.add(campaign.campaignStatus);
    }

    return {
        products: Array.from(products.entries()).map(([id, name]) => ({ id, name })),
        campaigns: Array.from(campaignNames).map((name) => ({ id: name, name })),
        statuses: Array.from(statuses),
    };
}
