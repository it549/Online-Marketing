export interface FacebookCampaign {
    id: string;
    name: string;
    spend: number;
    leads: number;
    cpl: number;
    status: string;
}

export interface FacebookSummary {
    spend: number;
    leads: number;
    cpl: number;
    ctr: number;
}

export interface FacebookCampaignResponse {
    summary: FacebookSummary;
    campaigns: FacebookCampaign[];
}
