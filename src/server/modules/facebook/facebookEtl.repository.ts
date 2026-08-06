import { config } from "@/server/configurations/config";
import type { BreakdownDimension, EntityLevel } from "@/server/core/etl/etl.types";
import type { FacebookCredentials } from "./facebookAuth";
import { fetchFacebookGraphItem, fetchFacebookGraphList } from "./facebookGraph.client";

export interface FacebookEntityRow {
    id: string;
    name: string;
    status: string;
    campaign_id?: string;
    adset_id?: string;
    creative?: { id?: string };
}

export interface FacebookActionValue {
    action_type: string;
    value: string;
}

export interface FacebookInsightRow {
    campaign_id?: string;
    adset_id?: string;
    ad_id?: string;
    impressions?: string;
    clicks?: string;
    spend?: string;
    reach?: string;
    frequency?: string;
    ctr?: string;
    cpc?: string;
    cpm?: string;
    actions?: FacebookActionValue[];
    action_values?: FacebookActionValue[];
    [dimension: string]: unknown; // breakdown dimension value, e.g. "age": "25-34"
}

export interface FacebookCreativeRow {
    id: string;
    effective_object_story_id?: string;
    object_story_id?: string;
}

export interface FacebookPostRow {
    id: string;
    message?: string;
    created_time?: string;
    permalink_url?: string;
    attachments?: unknown;
    likes?: { summary?: { total_count?: number } };
    comments?: { summary?: { total_count?: number } };
    shares?: { count?: number };
}

const ENTITY_EDGE: Record<"campaigns" | "adsets" | "ads", string> = {
    campaigns: "campaigns",
    adsets: "adsets",
    ads: "ads",
};

export async function getFacebookEntities(
    entity: "campaigns" | "adsets" | "ads",
    credentials: FacebookCredentials,
): Promise<FacebookEntityRow[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${credentials.adAccountId}/${ENTITY_EDGE[entity]}`);

    const fields = entity === "adsets"
        ? "id,name,status,campaign_id"
        : entity === "ads"
            ? "id,name,status,adset_id,campaign_id,creative{id}"
            : "id,name,status";

    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphList<FacebookEntityRow>(url);
}

const INSIGHT_FIELDS = "campaign_id,adset_id,ad_id,impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,actions,action_values";
const CREATIVE_FIELDS = "effective_object_story_id,object_story_id"
const POST_FIELDS = "id,message,created_time,permalink_url,attachments,likes.summary(true),comments.summary(true),shares"

export async function getFacebookInsights(
    credentials: FacebookCredentials,
    level: Lowercase<EntityLevel>,
    date: string,
): Promise<FacebookInsightRow[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${credentials.adAccountId}/insights`);
    url.searchParams.set("level", level);
    url.searchParams.set("time_range", JSON.stringify({ since: date, until: date }));
    url.searchParams.set("fields", INSIGHT_FIELDS);
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphList<FacebookInsightRow>(url);
}

const BREAKDOWN_FIELD: Record<BreakdownDimension, string> = {
    AGE: "age",
    GENDER: "gender",
    REGION: "region",
    PUBLISHER_PLATFORM: "publisher_platform",
    PLATFORM_POSITION: "platform_position",
};

export async function getFacebookInsightsByBreakdown(
    credentials: FacebookCredentials,
    date: string,
    dimension: BreakdownDimension,
): Promise<FacebookInsightRow[]> {
    const breakdownField = BREAKDOWN_FIELD[dimension];
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${credentials.adAccountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("time_range", JSON.stringify({ since: date, until: date }));
    url.searchParams.set("fields", INSIGHT_FIELDS);
    url.searchParams.set("breakdowns", breakdownField);
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    const rows = await fetchFacebookGraphList<FacebookInsightRow>(url);
    return rows.map((row) => ({ ...row, [breakdownField]: row[breakdownField] }));
}

/**
 * Facebook rejects `platform_position` requested alone alongside action-decomposed
 * fields (actions/action_values) -- error #100 "Current combination of data
 * breakdown columns (action_type, platform_position) is invalid". Per Facebook's
 * documented breakdown-compatibility rules, platform_position is only valid
 * combined with publisher_platform in the same request. This fetches both
 * dimensions in one call; callers derive separate PUBLISHER_PLATFORM and
 * PLATFORM_POSITION rows from the same combined response.
 */
export async function getFacebookInsightsByJointBreakdown(
    credentials: FacebookCredentials,
    date: string,
    dimensions: readonly [BreakdownDimension, BreakdownDimension],
): Promise<FacebookInsightRow[]> {
    const breakdownFields = dimensions.map((dimension) => BREAKDOWN_FIELD[dimension]);
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${credentials.adAccountId}/insights`);
    url.searchParams.set("level", "campaign");
    url.searchParams.set("time_range", JSON.stringify({ since: date, until: date }));
    url.searchParams.set("fields", INSIGHT_FIELDS);
    url.searchParams.set("breakdowns", breakdownFields.join(","));
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphList<FacebookInsightRow>(url);
}

export const FACEBOOK_BREAKDOWN_FIELD = BREAKDOWN_FIELD;

export async function getFacebookAdCreative(credentials: FacebookCredentials, creativeId: string) {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${creativeId}`)
    url.searchParams.set("fields", CREATIVE_FIELDS)
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphItem<FacebookCreativeRow>(url);
}

export async function getFacebookPostById(credentials: FacebookCredentials, postId: string) {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${postId}`)
    url.searchParams.set("fields", POST_FIELDS)
    url.searchParams.set("access_token", credentials.accessToken);
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphItem<FacebookPostRow>(url)
}
