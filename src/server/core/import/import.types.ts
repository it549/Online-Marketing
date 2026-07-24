export type PlatformCode =
    | "SHOPEE"
    | "META"
    | "TIKTOK"
    | "GOOGLE_ADS";

export enum Platform {
    SHOPEE = "SHOPEE",
    META = "META",
    TIKTOK = "TIKTOK",
    GOOGLE_ADS = "GOOGLE_ADS"
}
export interface NormalizedCampaign {
    platformCode: PlatformCode;
    externalCampaignId: string;
    campaignName: string;
    campaignStatus: string;
    adType?: string;
    productId: string | null;
    bidStrategy: string | null;
    placement: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    metrics: NormalizedCampaignMetrics;
}

export interface NormalizedCampaignMetrics {
    impressions: number;
    clicks: number;
    ctr: number | null;
    addToCart: number;
    addToCartRate: number | null;
    orders: number;
    directOrders: number;
    conversionRate: number | null;
    directConversionRate: number | null;
    costPerOrder: number | null;
    directCostPerOrder: number | null;
    unitsSold: number;
    directUnitsSold: number;
    revenue: number;
    directRevenue: number;
    spend: number;
    roas: number | null;
    directRoas: number | null;
    acos: number | null;
    directAcos: number | null;
    productImpressions: number;
    productClicks: number;
    productCtr: number | null;
    voucherAmount: number;
    voucherSales: number;
}

export interface NormalizedImportResult {
    platformCode: PlatformCode;
    report: NormalizedReport;
    campaigns: NormalizedCampaign[];
}

export interface NormalizedReport {
    fileName: string;
    reportName: string;
    reportStartDate: Date;
    reportEndDate: Date;
    totalRecords: number;
}