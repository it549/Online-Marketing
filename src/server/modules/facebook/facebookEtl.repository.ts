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

export interface FacebookAttachment {
    type?: string;
    media?: { image?: { src?: string; width?: number; height?: number } };
    subattachments?: { data?: FacebookAttachment[] };
}

export interface FacebookPostAttachments {
    data?: FacebookAttachment[];
}

export interface FacebookPostRow {
    id: string;
    message?: string;
    created_time?: string;
    permalink_url?: string;
    attachments?: FacebookPostAttachments;
    likes?: { summary?: { total_count?: number } };
    comments?: { summary?: { total_count?: number } };
    shares?: { count?: number };
}

const ENTITY_EDGE: Record<"campaigns" | "adsets" | "ads", string> = {
    campaigns: "campaigns",
    adsets: "adsets",
    ads: "ads",
};

interface GraphErrorBody {
    error?: { message?: string };
}

async function fetchGraphSingle<T>(url: URL): Promise<T | null> {
    const response = await fetch(url.toString(), { cache: "no-store" });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error((errorText));
    }

    const body = (await response.json()) as T & GraphErrorBody;
    if (body.error) throw new Error(body.error.message ?? "Facebook Graph API error");

    return body;
}

interface BatchSubResponse {
    code: number;
    body: string;
}

const BATCH_CHUNK_SIZE = 50;

async function batchGetObjects<T>(
    relativeUrls: string[],
    accessToken: string,
): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    for (let i = 0; i < relativeUrls.length; i += BATCH_CHUNK_SIZE) {
        const chunk = relativeUrls.slice(i, i + BATCH_CHUNK_SIZE);
        const batchPayload = chunk.map((relative_url) => ({ method: "GET", relative_url }));

        const response = await fetch(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                access_token: accessToken,
                batch: JSON.stringify(batchPayload),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error((errorText));
        }

        const subResponses = (await response.json()) as BatchSubResponse[];
        for (const sub of subResponses) {
            if (sub.code !== 200) {
                results.push(null); // object ถูกลบ/ไม่มีสิทธิ์ -> ข้ามไป ไม่ทำให้ batch ทั้งชุดพัง
                continue;
            }
            try {
                results.push(JSON.parse(sub.body) as T);
            } catch {
                results.push(null);
            }
        }
    }

    return results;
}

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
// Page-scoped token (Content Sync) gets #10 on likes.summary(true)/comments.summary(true) even with
// pages_read_engagement granted -- unlike POST_FIELDS' other callers, which use the ad-account token.
// Scoped separately so the ads ETL path (getFacebookPostById/getFacebookPostsBatch) is untouched.
const PAGE_POST_FIELDS = "id,message,created_time,permalink_url,attachments{type,media,subattachments},shares"
const ADS_FIELDS = "id,name,creative,campaign,adset"

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

/**
 * Lists a Page's own posts directly (vs. getFacebookPostById's single-post
 * lookup used to hydrate posts discovered indirectly via an ad's creative).
 * Requires a Page-scoped access token, NOT the ad-account token used
 * elsewhere in this file -- see config.facebook.pageAccessToken.
 */
export async function getFacebookPagePosts(pageId: string, pageAccessToken: string): Promise<FacebookPostRow[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${pageId}/posts`);
    url.searchParams.set("fields", PAGE_POST_FIELDS);
    url.searchParams.set("access_token", pageAccessToken);
    url.searchParams.set("limit", "100");

    return fetchFacebookGraphList<FacebookPostRow>(url);
}

export async function getFacebookAccountAds(credentials: FacebookCredentials): Promise<FacebookEntityRow[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/${credentials.adAccountId}/ads`);
    url.searchParams.set("fields", ADS_FIELDS);
    url.searchParams.set("access_token", credentials.accessToken); // ⭐ เดิมขาดตรงนี้
    url.searchParams.set("limit", "500");

    return fetchFacebookGraphList<FacebookEntityRow>(url);
}

/** Batch ดึง creative หลายตัวพร้อมกัน คืนเป็น Map<creativeId, creative> */
export async function getFacebookAdCreativesBatch(
    creativeIds: string[],
    credentials: FacebookCredentials,
): Promise<Map<string, FacebookCreativeRow>> {
    const relativeUrls = creativeIds.map((id) => `${id}?fields=${CREATIVE_FIELDS}`);
    const creatives = await batchGetObjects<FacebookCreativeRow>(relativeUrls, credentials.accessToken);

    const map = new Map<string, FacebookCreativeRow>();
    creatives.forEach((creative, idx) => {
        if (creative) map.set(creativeIds[idx], creative);
    });
    return map;
}

/** Batch ดึง post content หลายตัวพร้อมกัน คืนเป็น Map<postId, post> */
export async function getFacebookPostsBatch(
    postIds: string[],
    credentials: FacebookCredentials,
): Promise<Map<string, FacebookPostRow>> {
    const relativeUrls = postIds.map((id) => `${id}?fields=${POST_FIELDS}`);
    const posts = await batchGetObjects<FacebookPostRow>(relativeUrls, credentials.accessToken);

    const map = new Map<string, FacebookPostRow>();
    posts.forEach((post, idx) => {
        if (post) map.set(postIds[idx], post);
    });
    return map;
}

export async function getFacebookPageAccessToken(
    userAccessToken: string,
    pageId: string,
): Promise<string | null> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/me/accounts`);
    url.searchParams.set("access_token", userAccessToken);
    url.searchParams.set("fields", "id,access_token");
    url.searchParams.set("limit", "100");

    const pages = await fetchFacebookGraphList<{ id: string; access_token: string }>(url);
    return pages.find((page) => page.id === pageId)?.access_token ?? null;
}