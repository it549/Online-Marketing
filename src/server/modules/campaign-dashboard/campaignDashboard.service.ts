import { toNumber } from "@/utils/decimal";
import { PlatformCode } from "@/server/core/import/import.types";
import { CampaignDashboardRecord, CampaignDashboardResponse } from "@/types/campaignDashboard";
import { getCampaignDashboardRepository } from "./campaignDashboard.repository";

export async function getCampaignDashboardData(platformCode: PlatformCode): Promise<CampaignDashboardResponse> {
    const repository = await getCampaignDashboardRepository(platformCode);

    if (!repository || repository.campaigns.length === 0) {
        return buildEmptyResponse();
    }

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    // One row per imported record (every CampaignReportMetric, i.e. every
    // campaign x import-period combination) -- NOT collapsed per campaign.
    // The summary cards below are the only place totals get aggregated
    // across every import; the table itself must show everything that was
    // ever imported, one row per file/period, for full traceability.
    const records: CampaignDashboardRecord[] = repository.campaigns.flatMap((campaign) =>
        campaign.reportMetrics.map((metric) => {
            const spend = toNumber(metric.spend);
            const revenue = toNumber(metric.revenue);
            const orders = metric.orders ?? 0;
            const clicks = metric.clicks ?? 0;
            const impressions = metric.impressions ?? 0;

            totalSpend += spend;
            totalRevenue += revenue;
            totalOrders += orders;
            totalClicks += clicks;
            totalImpressions += impressions;

            return {
                id: metric.id.toString(),
                campaignName: campaign.campaignName,
                periodStart: metric.reportStartDate.toISOString(),
                periodEnd: metric.reportEndDate.toISOString(),
                spend,
                revenue,
                profit: revenue - spend,
                roas: spend > 0 ? revenue / spend : null,
                orders,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
                status: campaign.campaignStatus,
            };
        }),
    );

    records.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());

    const startDates = repository.importJobs.map((job) => job.reportStartDate.getTime());
    const endDates = repository.importJobs.map((job) => job.reportEndDate.getTime());

    return {
        hasData: true,
        reportStartDate: startDates.length > 0 ? new Date(Math.min(...startDates)).toISOString() : null,
        reportEndDate: endDates.length > 0 ? new Date(Math.max(...endDates)).toISOString() : null,
        importCount: repository.importJobs.length,
        summary: {
            spend: totalSpend,
            revenue: totalRevenue,
            profit: totalRevenue - totalSpend,
            roas: totalSpend > 0 ? totalRevenue / totalSpend : null,
            orders: totalOrders,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
        },
        records,
    };
}

function buildEmptyResponse(): CampaignDashboardResponse {
    return {
        hasData: false,
        reportStartDate: null,
        reportEndDate: null,
        importCount: 0,
        summary: {
            spend: 0,
            revenue: 0,
            profit: 0,
            roas: null,
            orders: 0,
            ctr: null,
        },
        records: [],
    };
}
