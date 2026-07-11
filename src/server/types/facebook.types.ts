export interface FacebookCampaign {
    name: string;
    spend: number;
    leads: number;
    cpl: number;
    ctr: number;
    status: string;
}

export interface FacebookInsight {
    spend: number;
    leads: number;
    cpl: number;
    ctr: number;
    campaigns: FacebookCampaign[];
}
