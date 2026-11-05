export interface TikTokCampaign {
    id: string;
    name: string;
    spend: number;
    leads: number;
    cpl: number;
    status: "ACTIVE" | "PAUSED";
}

export interface TikTokSummary {
    spend: number;
    leads: number;
    cpl: number;
    ctr: number;
}

export interface TikTokCampaignResponse {
    summary: TikTokSummary;
    campaigns: TikTokCampaign[];
}
