import { toNumber } from "@/utils/decimal";
import { getShopeeCampaignsRepository } from "@/server/modules/shopee/shopeeDashboard.repository";

export interface ShopeeCampaignProfit {
    campaignName: string;
    spend: number;
    revenue: number;
    profit: number;
}

export async function getShopeeCampaignProfitRanking(): Promise<ShopeeCampaignProfit[]> {
    const repoResult = await getShopeeCampaignsRepository({});

    if (!repoResult) {
        return [];
    }

    const totalsByCampaign = new Map<string, { spend: number; revenue: number }>();

    for (const campaign of repoResult.campaigns) {
        const existing = totalsByCampaign.get(campaign.campaignName) ?? { spend: 0, revenue: 0 };

        for (const metric of campaign.reportMetrics) {
            existing.spend += toNumber(metric.spend);
            existing.revenue += toNumber(metric.revenue);
        }

        totalsByCampaign.set(campaign.campaignName, existing);
    }

    return Array.from(totalsByCampaign.entries())
        .map(([campaignName, totals]) => ({
            campaignName,
            spend: totals.spend,
            revenue: totals.revenue,
            profit: totals.revenue - totals.spend,
        }))
        .sort((a, b) => b.profit - a.profit);
}
