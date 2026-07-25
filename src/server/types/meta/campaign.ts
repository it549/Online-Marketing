export interface Campaign {
    name: string;
    status: string;
    spend: string;
    leads: string;
    cpl: string;
}

export interface CampaignSummary {
    spend: string;
    leads: string;
    cpl: string;
    ctr: string;
    campaigns: Campaign[];
}
