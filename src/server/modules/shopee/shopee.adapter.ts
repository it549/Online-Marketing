import { NormalizedCampaign, } from "@/server/core/import/import.types";

import { ShopeeRawCampaign, } from "./shopee.types";

const ACTIVE_STATUS_KEYWORDS = ["กำลังดำเนินการ", "เปิดใช้งาน", "ใช้งานอยู่",];

// Shopee reports use Thai status labels; normalize to ACTIVE/PAUSED so the
// dashboard's StatusBadge (shared with Facebook/TikTok) renders consistently.
function normalizeShopeeStatus(status: string,): "ACTIVE" | "PAUSED" {
    return ACTIVE_STATUS_KEYWORDS.some((keyword) => status.includes(keyword,),) ? "ACTIVE" : "PAUSED";
}

export function normalizeShopeeCampaign(campaign: ShopeeRawCampaign,): NormalizedCampaign {
    return {
        platformCode: "SHOPEE",
        externalCampaignId: createShopeeExternalCampaignId(campaign,),
        campaignName: campaign.campaignName,
        campaignStatus: normalizeShopeeStatus(campaign.status,),
        adType: campaign.adType,
        productId: campaign.productId,
        bidStrategy: campaign.bidStrategy,
        placement: campaign.placement,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        metrics: {
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            ctr: campaign.ctr,
            addToCart: campaign.addToCart,
            addToCartRate: campaign.addToCartRate,
            orders: campaign.orders,
            directOrders: campaign.directOrders,
            conversionRate: campaign.conversionRate,
            directConversionRate: campaign.directConversionRate,
            costPerOrder: campaign.costPerOrder,
            directCostPerOrder: campaign.directCostPerOrder,
            unitsSold: campaign.unitsSold,
            directUnitsSold: campaign.directUnitsSold,
            revenue: campaign.revenue,
            directRevenue: campaign.directRevenue,
            spend: campaign.spend,
            roas: campaign.roas,
            directRoas: campaign.directRoas,
            acos: campaign.acos,
            directAcos: campaign.directAcos,
            productImpressions: campaign.productImpressions,
            productClicks: campaign.productClicks,
            productCtr: campaign.productCtr,
            voucherAmount: campaign.voucherAmount,
            voucherSales: campaign.voucherSales,
        },
    };
}

export function normalizeShopeeCampaigns(campaigns: ShopeeRawCampaign[],): NormalizedCampaign[] {
    return campaigns.map(normalizeShopeeCampaign,);
}

function createShopeeExternalCampaignId(campaign: ShopeeRawCampaign,): string {
    return [campaign.campaignName, campaign.productId ?? "NO_PRODUCT",].join("_").trim();
}