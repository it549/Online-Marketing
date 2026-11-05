export type CampaignPlatform = "facebook" | "shopee" | "tiktok" | "googleAds";

export type CampaignStatusTone = "positive" | "neutral" | "negative";

export interface CampaignRow {
    id: string;
    platform: CampaignPlatform;
    name: string;
    spend: number;
    revenue: number | null;
    roas: number | null;
    secondaryLabel: string;
    secondaryValue: string;
    statusLabel: string;
    statusTone: CampaignStatusTone;
}

export interface CampaignsResponse {
    connected: {
        facebook: boolean;
        shopee: boolean;
        tiktok: boolean;
    };
    campaigns: CampaignRow[];
}

export interface CampaignDetailPost {
    postId: string;
    message: string | null;
    permalink: string | null;
    publishedAt: string | null;
    adName: string;
    spend: number;
    reach: number;
    clicks: number;
}

export interface CampaignDetailResponse {
    campaignName: string;
    statusLabel: string;
    statusTone: CampaignStatusTone;
    posts: CampaignDetailPost[];
}
