export type ShopeePeriodGranularity = "week" | "month" | "quarter";

export interface ShopeeDashboardFilters {
    dateFrom?: string;
    dateTo?: string;
    productId?: string;
    campaignName?: string;
    status?: string;
}

export interface ShopeeDashboardBucket {
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    spend: number;
    revenue: number;
    profit: number;
    roas: number | null;
    orders: number;
    ctr: number | null;
}

export interface ShopeeDashboardSummary {
    spend: number;
    revenue: number;
    profit: number;
    roas: number | null;
    orders: number;
    ctr: number | null;
}

export interface ShopeeFilterOption {
    id: string;
    name: string;
}

export interface ShopeeAvailableFilters {
    products: ShopeeFilterOption[];
    campaigns: ShopeeFilterOption[];
    statuses: string[];
}

export interface ShopeeImportBatch {
    id: string;
    filename: string;
    importedAt: string | null;
    totalRecords: number;
    periodLabel: string | null;
}

export interface ShopeeDashboardResponse {
    hasData: boolean;
    granularity: ShopeePeriodGranularity;
    summary: ShopeeDashboardSummary;
    buckets: ShopeeDashboardBucket[];
    availableFilters: ShopeeAvailableFilters;
    importBatches: ShopeeImportBatch[];
}
