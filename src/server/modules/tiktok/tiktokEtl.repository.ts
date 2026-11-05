import { config } from "@/server/configurations/config";

// Shapes match TikTok Business API v1.3 response objects so the adapter below
// can be implemented and unit-tested for real against fixture JSON even though
// no live call is wired in yet -- see tiktokEtl.service.ts for why.
export interface TikTokCampaignRow {
    campaign_id: string;
    campaign_name: string;
    operation_status: string;
}

export interface TikTokAdGroupRow {
    adgroup_id: string;
    adgroup_name: string;
    campaign_id: string;
    operation_status: string;
}

export interface TikTokAdRow {
    ad_id: string;
    ad_name: string;
    adgroup_id: string;
    campaign_id: string;
    operation_status: string;
}

export interface TikTokReportRow {
    dimensions: { campaign_id?: string; adgroup_id?: string; ad_id?: string; stat_time_day?: string };
    metrics: {
        impressions?: string;
        clicks?: string;
        spend?: string;
        reach?: string;
        frequency?: string;
        ctr?: string;
        cpc?: string;
        cpm?: string;
        conversion?: string;
        conversion_value?: string;
    };
}

export interface TikTokCredentials {
    advertiserId: string;
    accessToken: string;
}

function isTikTokApiConfigured(): boolean {
    return Boolean(config.tiktok.appId && config.tiktok.appSecret);
}

// Real endpoint: GET https://business-api.tiktok.com/open_api/v1.3/campaign/get/
export async function getTikTokCampaigns(_credentials: TikTokCredentials): Promise<TikTokCampaignRow[]> {
    void _credentials;
    if (!isTikTokApiConfigured()) return [];
    return [];
}

// Real endpoint: GET https://business-api.tiktok.com/open_api/v1.3/adgroup/get/
export async function getTikTokAdGroups(_credentials: TikTokCredentials): Promise<TikTokAdGroupRow[]> {
    void _credentials;
    if (!isTikTokApiConfigured()) return [];
    return [];
}

// Real endpoint: GET https://business-api.tiktok.com/open_api/v1.3/ad/get/
export async function getTikTokAds(_credentials: TikTokCredentials): Promise<TikTokAdRow[]> {
    void _credentials;
    if (!isTikTokApiConfigured()) return [];
    return [];
}

// Real endpoint: GET https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/
// (data_level=AUCTION_{CAMPAIGN|ADGROUP|AD}, dimensions=[<level>_id, stat_time_day])
export async function getTikTokReport(
    _credentials: TikTokCredentials,
    _level: "CAMPAIGN" | "ADGROUP" | "AD",
    _date: string,
): Promise<TikTokReportRow[]> {
    void _credentials;
    void _level;
    void _date;
    if (!isTikTokApiConfigured()) return [];
    return [];
}
