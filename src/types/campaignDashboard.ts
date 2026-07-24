export interface CampaignDashboardRecord {
    id: string;
    campaignName: string;
    periodStart: string;
    periodEnd: string;
    spend: number;
    revenue: number;
    profit: number;
    roas: number | null;
    orders: number;
    ctr: number | null;
    status: string;
}

export interface CampaignDashboardSummary {
    spend: number;
    revenue: number;
    profit: number;
    roas: number | null;
    orders: number;
    ctr: number | null;
}

export interface CampaignDashboardResponse {
    hasData: boolean;
    reportStartDate: string | null;
    reportEndDate: string | null;
    importCount: number;
    summary: CampaignDashboardSummary;
    records: CampaignDashboardRecord[];
}
