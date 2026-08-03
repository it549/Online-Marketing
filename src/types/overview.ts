export type OverviewPlatformId = "facebook" | "shopee" | "tiktok" | "googleAds";

export interface OverviewPlatformSummary {
    id: OverviewPlatformId;
    name: string;
    icon: string;
    sourceType: "api" | "csv";
    hasData: boolean;
    spend: number;
    revenue: number | null;
    roas: number | null;
    statusLabel: string;
}

export interface OverviewCampaignRow {
    id: string;
    name: string;
    platform: "facebook" | "tiktok";
    spend: number;
    leads: number;
    cpl: number;
    status: string;
}

export interface OverviewTotals {
    spend: number;
    shopeeRevenue: number;
    leads: number;
    avgRoas: number | null;
    avgCpl: number | null;
}

export interface OverviewResponse {
    generatedAt: string;
    totals: OverviewTotals;
    platforms: OverviewPlatformSummary[];
    topCampaigns: OverviewCampaignRow[];
}
