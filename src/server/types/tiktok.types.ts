export interface TikTokCampaign {
    campaignName: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    cpa: number;
    status: "ACTIVE" | "PAUSED";
}

export interface TikTokInsight {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    cpa: number;
    campaigns: TikTokCampaign[];
}
