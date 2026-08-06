import { config } from "@/server/configurations/config";
import { googleAdsClient } from "./client";
import type { GoogleAdsCredentials } from "@/types/googleAds";

export interface GoogleAdsCampaignRow {
    campaign?: { id?: string | number | null; name?: string | null; status?: string | null } | null;
    metrics?: GoogleAdsMetricsRow | null;
    segments?: { date?: string | null } | null;
}

export interface GoogleAdsAdGroupRow {
    ad_group?: { id?: string | number | null; name?: string | null; status?: string | null; campaign?: string | null } | null;
    campaign?: { id?: string | number | null } | null;
    metrics?: GoogleAdsMetricsRow | null;
    segments?: { date?: string | null } | null;
}

export interface GoogleAdsMetricsRow {
    cost_micros?: number | string | null;
    impressions?: number | string | null;
    clicks?: number | string | null;
    conversions?: number | string | null;
    conversions_value?: number | string | null;
    ctr?: number | string | null;
    average_cpc?: number | string | null;
}

// Exact single-day queries -- the existing CAMPAIGN_PERFORMANCE_QUERY (LAST_30_DAYS)
// is for the live dashboard pull and is intentionally left untouched.
const CAMPAIGN_DAILY_QUERY = (date: string) => `
    SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        segments.date
    FROM campaign
    WHERE segments.date = '${date}'
`;

const AD_GROUP_DAILY_QUERY = (date: string) => `
    SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.id,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        segments.date
    FROM ad_group
    WHERE segments.date = '${date}'
`;

function customerFor(credentials: GoogleAdsCredentials) {
    return googleAdsClient.Customer({
        customer_id: credentials.customerId,
        refresh_token: credentials.refreshToken,
        login_customer_id: config.google.customerID,
    });
}

export async function getGoogleAdsCampaignDaily(credentials: GoogleAdsCredentials, date: string): Promise<GoogleAdsCampaignRow[]> {
    return customerFor(credentials).query(CAMPAIGN_DAILY_QUERY(date)) as unknown as Promise<GoogleAdsCampaignRow[]>;
}

export async function getGoogleAdsAdGroupDaily(credentials: GoogleAdsCredentials, date: string): Promise<GoogleAdsAdGroupRow[]> {
    return customerFor(credentials).query(AD_GROUP_DAILY_QUERY(date)) as unknown as Promise<GoogleAdsAdGroupRow[]>;
}
