import { MetaError } from "./error/MetaError";

export interface MetaCampaignResponse {
    data?: MetaCampaign[];
    paging?: MetaPaging;
    error?: MetaError;
}

export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    insights?: MetaInsights;
}

export interface MetaInsights {
    data: MetaInsight[];
}

export interface MetaInsight {
    spend: string;
    impressions?: string;
    reach?: string;
    clicks?: string;
    ctr: string;
    actions: MetaAction[];
    cost_per_action_type: MetaAction[];
    action_values?: MetaAction[];
}

export interface MetaAction {
    action_type: string;
    value: string;
}

export interface MetaPaging {
    cursors: MetaCursor;
}

export interface MetaCursor {
    before: string;
    after: string;
}
