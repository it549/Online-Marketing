import { NormalizedCampaign, NormalizedImportResult } from "@/server/core/import/import.types";

const campaign: NormalizedCampaign = {
    platformCode: "SHOPEE",
    externalCampaignId: "product-123",
    campaignName: "Test Campaign",
    campaignStatus: "ACTIVE",
    adType: "CPC",
    productId: "product-123",
    bidStrategy: null,
    placement: null,
    startDate: new Date("2026-07-13"),
    endDate: new Date("2026-07-19"),
    metrics: {
        impressions: 10000,
        clicks: 500,
        ctr: 5,
        addToCart: 30,
        addToCartRate: 6,
        orders: 20,
        directOrders: 15,
        conversionRate: 4,
        directConversionRate: 3,
        costPerOrder: 50,
        directCostPerOrder: 66.67,
        unitsSold: 25,
        directUnitsSold: 20,
        revenue: 5000,
        directRevenue: 4000,
        spend: 1000,
        roas: 5,
        directRoas: 4,
        acos: 20,
        directAcos: 25,
        productImpressions: 8000,
        productClicks: 300,
        productCtr: 3.75,
        voucherAmount: 0,
        voucherSales: 0,
    },
};

const result: NormalizedImportResult = {
    platformCode: "SHOPEE",
    report: {
        fileName: "shopee-report.csv",
        reportName: "รายงานโฆษณา CPC ทั้งหมด - Shopee ประเทศไทย",
        reportStartDate: new Date("2026-07-13"),
        reportEndDate: new Date("2026-07-19"),
        totalRecords: 1,
    },
    campaigns: [campaign],
};

console.log("========== NORMALIZED IMPORT RESULT SHAPE ==========");
console.log(result);
