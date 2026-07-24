import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";

const SHOPEE_PLATFORM_CODE = "SHOPEE";

export interface ShopeeDashboardQueryFilters {
    productId?: string;
    campaignName?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export async function getShopeeCampaignsRepository(filters: ShopeeDashboardQueryFilters) {
    const platform = await prisma.platform.findUnique({
        where: { code: SHOPEE_PLATFORM_CODE },
    });

    if (!platform) {
        return null;
    }

    const campaignWhere: Prisma.CampaignWhereInput = { platformId: platform.id };

    if (filters.productId) campaignWhere.productId = filters.productId;
    if (filters.campaignName) campaignWhere.campaignName = filters.campaignName;
    if (filters.status) campaignWhere.campaignStatus = filters.status;

    const metricWhere: Prisma.CampaignReportMetricWhereInput = {};

    if (filters.dateFrom) metricWhere.reportEndDate = { gte: filters.dateFrom };
    if (filters.dateTo) metricWhere.reportStartDate = { lte: filters.dateTo };

    const campaigns = await prisma.campaign.findMany({
        where: campaignWhere,
        include: { reportMetrics: { where: metricWhere } },
    });

    return { platform, campaigns };
}

// Unfiltered list, used only to populate filter dropdown options -- always
// shows every real product/campaign/status regardless of the currently
// selected filters, so options never disappear as the user narrows down.
export async function getShopeeAvailableFiltersRepository() {
    const platform = await prisma.platform.findUnique({
        where: { code: SHOPEE_PLATFORM_CODE },
    });

    if (!platform) {
        return [];
    }

    return prisma.campaign.findMany({
        where: { platformId: platform.id },
        select: { productId: true, campaignName: true, campaignStatus: true },
    });
}
