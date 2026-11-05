export interface ShopeeReportMetadata {
    userName: string;
    shopName: string;
    shopId: string;
    reportCreatedAt: Date | null;
    reportStartDate: Date | null;
    reportEndDate: Date | null;
}

export interface ShopeeRawCampaign {
    campaignName: string;
    status: string;
    adType: string;
    productId: string | null;
    optimization: string | null;
    bidStrategy: string | null;
    placement: string | null;
    startDate: Date | null;
    endDate: Date | null;
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

export interface ShopeeParsedReport {
    metadata: ShopeeReportMetadata;
    campaigns: ShopeeRawCampaign[];
}