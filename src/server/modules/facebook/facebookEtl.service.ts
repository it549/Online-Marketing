import type { Company } from "@prisma/client";
import { saveEtlSyncResult } from "@/server/core/etl/etl-database.service";
import { formatDateParam } from "@/server/core/etl/etlDate.util";
import type { BreakdownDimension, EntityLevel, NormalizedEtlSyncResult, NormalizedPost, PlatformSyncResult } from "@/server/core/etl/etl.types";
import { isFacebookTokenExpired, resolveFacebookCredentials, type FacebookCredentials } from "./facebookAuth";
import {
    getFacebookAdCreative,
    getFacebookEntities,
    getFacebookInsights,
    getFacebookInsightsByBreakdown,
    getFacebookInsightsByJointBreakdown,
    getFacebookPostById,
    type FacebookEntityRow,
} from "./facebookEtl.repository";
import {
    normalizeFacebookAd,
    normalizeFacebookAdSet,
    normalizeFacebookBreakdownInsight,
    normalizeFacebookCampaign,
    normalizeFacebookInsight,
    normalizeFacebookPost,
} from "./facebookEtl.adapter";

const ENTITY_LEVELS: EntityLevel[] = ["CAMPAIGN", "ADSET", "AD"];
const LEVEL_PARAM: Record<EntityLevel, Lowercase<EntityLevel>> = { CAMPAIGN: "campaign", ADSET: "adset", AD: "ad" };

// AGE/GENDER/REGION are each valid as standalone breakdowns. PUBLISHER_PLATFORM
// and PLATFORM_POSITION are not -- platform_position alone is rejected by
// Facebook (#100) when action-decomposed fields are present, so those two are
// always fetched together in one call (see getFacebookInsightsByJointBreakdown).
const SINGLE_BREAKDOWN_DIMENSIONS: BreakdownDimension[] = ["AGE", "GENDER", "REGION"];
const JOINT_BREAKDOWN_DIMENSIONS: readonly [BreakdownDimension, BreakdownDimension] = ["PUBLISHER_PLATFORM", "PLATFORM_POSITION"];

/**
 * Resolves each ad's underlying post (ad -> creative -> effective_object_story_id
 * -> post) and pulls that post's engagement counts, so advertised posts can be
 * compared against organic-only ones. Creative/post lookups are best-effort --
 * a single inaccessible or deleted post must not fail the whole sync.
 */
async function resolveFacebookAdPosts(
    credentials: FacebookCredentials,
    adRows: FacebookEntityRow[],
): Promise<{ postIdByAdExternalId: Map<string, string>; posts: NormalizedPost[] }> {
    const creativeIds = [...new Set(adRows.map((ad) => ad.creative?.id).filter((id): id is string => !!id))];

    const creativeResults = await Promise.all(
        creativeIds.map(async (creativeId) => {
            try {
                return await getFacebookAdCreative(credentials, creativeId);
            } catch (error) {
                console.warn(`Facebook: failed to fetch creative ${creativeId}`, error);
                return null;
            }
        }),
    );

    const postIdByCreativeId = new Map<string, string>();
    creativeResults.forEach((creative, index) => {
        const postId = creative?.effective_object_story_id ?? creative?.object_story_id;
        if (postId) postIdByCreativeId.set(creativeIds[index], postId);
    });

    const postIdByAdExternalId = new Map<string, string>();
    for (const ad of adRows) {
        const postId = ad.creative?.id ? postIdByCreativeId.get(ad.creative.id) : undefined;
        if (postId) postIdByAdExternalId.set(ad.id, postId);
    }

    const uniquePostIds = [...new Set(postIdByAdExternalId.values())];
    const postResults = await Promise.all(
        uniquePostIds.map(async (postId) => {
            try {
                return await getFacebookPostById(credentials, postId);
            } catch (error) {
                console.warn(`Facebook: failed to fetch post ${postId}`, error);
                return null;
            }
        }),
    );

    const posts = postResults
        .filter((post): post is NonNullable<typeof post> => post !== null)
        .map(normalizeFacebookPost);

    return { postIdByAdExternalId, posts };
}

export async function syncFacebookAdsForCompany(
    company: Company,
    targetDate: Date,
    options: { dryRun?: boolean } = {},
): Promise<PlatformSyncResult> {
    const credentials = resolveFacebookCredentials(company);
    if (!credentials) return { status: "skipped", reason: "not_connected" };
    if (isFacebookTokenExpired(company)) return { status: "skipped", reason: "token_expired" };

    const dateParam = formatDateParam(targetDate);

    const [campaignRows, adSetRows, adRows] = await Promise.all([
        getFacebookEntities("campaigns", credentials),
        getFacebookEntities("adsets", credentials),
        getFacebookEntities("ads", credentials),
    ]);

    const insightsByLevel = await Promise.all(
        ENTITY_LEVELS.map((level) => getFacebookInsights(credentials, LEVEL_PARAM[level], dateParam)),
    );

    const [singleBreakdownRows, jointBreakdownRows] = await Promise.all([
        Promise.all(SINGLE_BREAKDOWN_DIMENSIONS.map((dimension) => getFacebookInsightsByBreakdown(credentials, dateParam, dimension))),
        getFacebookInsightsByJointBreakdown(credentials, dateParam, JOINT_BREAKDOWN_DIMENSIONS),
    ]);

    const { postIdByAdExternalId, posts } = await resolveFacebookAdPosts(credentials, adRows);

    const singleBreakdowns = SINGLE_BREAKDOWN_DIMENSIONS.flatMap((dimension, index) =>
        singleBreakdownRows[index]
            .map((row) => normalizeFacebookBreakdownInsight(row, dimension, targetDate))
            .filter((breakdown): breakdown is NonNullable<typeof breakdown> => breakdown !== null),
    );

    // Same joint response, normalized twice -- once per dimension -- since each
    // row carries both publisher_platform and platform_position values.
    const jointBreakdowns = JOINT_BREAKDOWN_DIMENSIONS.flatMap((dimension) =>
        jointBreakdownRows
            .map((row) => normalizeFacebookBreakdownInsight(row, dimension, targetDate))
            .filter((breakdown): breakdown is NonNullable<typeof breakdown> => breakdown !== null),
    );

    const result: NormalizedEtlSyncResult = {
        platformCode: "META",
        syncDate: targetDate,
        campaigns: campaignRows.map(normalizeFacebookCampaign),
        adSets: adSetRows.map(normalizeFacebookAdSet),
        ads: adRows.map((ad) => ({ ...normalizeFacebookAd(ad), externalPostId: postIdByAdExternalId.get(ad.id) })),
        posts,
        insights: ENTITY_LEVELS.flatMap((level, index) =>
            insightsByLevel[index]
                .map((row) => normalizeFacebookInsight(row, level, targetDate))
                .filter((insight): insight is NonNullable<typeof insight> => insight !== null),
        ),
        breakdowns: [...singleBreakdowns, ...jointBreakdowns],
    };

    return saveEtlSyncResult(company.id, result, options);
}
