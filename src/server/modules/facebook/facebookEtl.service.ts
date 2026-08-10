import type { Company } from "@prisma/client";
import { saveEtlSyncResult } from "@/server/core/etl/etl-database.service";
import { formatDateParam } from "@/server/core/etl/etlDate.util";
import type { BreakdownDimension, EntityLevel, NormalizedEtlSyncResult, NormalizedPost, PlatformSyncResult } from "@/server/core/etl/etl.types";
import { isFacebookTokenExpired, resolveFacebookCredentials, type FacebookCredentials } from "./facebookAuth";
import {
    getFacebookAccountAds,
    getFacebookAdCreative,
    getFacebookAdCreativesBatch,
    getFacebookEntities,
    getFacebookInsights,
    getFacebookInsightsByBreakdown,
    getFacebookInsightsByJointBreakdown,
    getFacebookPostById,
    getFacebookPostsBatch,
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
import { prisma } from "@/server/database/prisma";

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
    console.log("credentials resolved:", !!credentials);

    if (!credentials) {
        console.log("SKIP: not_connected");
        return { status: "skipped", reason: "not_connected" };
    }
    const expired = isFacebookTokenExpired(company);
    console.log("token expired check:", expired, "expiresAt:", company.facebookTokenExpiresAt); // ⭐

    if (expired) {
        console.log("SKIP: token_expired"); // ⭐
        return { status: "skipped", reason: "token_expired" };
    }

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

    console.log("Sample ad row:", JSON.stringify(adRows[0], null, 2));
    console.log("Ad count with creative.id:", adRows.filter(a => a.creative?.id).length, "/", adRows.length);
    return saveEtlSyncResult(company.id, result, options);
}

export async function syncFacebookAdPosts(
    companyId: bigint,
    platformId: bigint,
    credentials: FacebookCredentials,
): Promise<{ synced: number; skipped: number }> {
    // 1. ดึง ads ทั้งหมด (มี creative.id ติดมาด้วยจาก ADS_FIELDS)
    const ads = await getFacebookAccountAds(credentials);
    if (ads.length === 0) return { synced: 0, skipped: 0 };

    // 2. Batch ดึง creative ของทุก ad ที่มี creative.id
    const creativeIds = [
        ...new Set(ads.map((ad) => ad.creative?.id).filter((id): id is string => !!id)),
    ];
    const creativeMap = await getFacebookAdCreativesBatch(creativeIds, credentials);

    // 3. Batch ดึง post content จาก effective_object_story_id (fallback object_story_id)
    const postIds = [
        ...new Set(
            Array.from(creativeMap.values())
                .map((c) => c.effective_object_story_id ?? c.object_story_id)
                .filter((id): id is string => !!id),
        ),
    ];
    const postMap = await getFacebookPostsBatch(postIds, credentials);

    let synced = 0;
    let skipped = 0;

    // 4. Upsert ad_posts + update ads.post_id ทีละ ad
    //    (ถ้า ad เยอะมากค่อยพิจารณาทำเป็น transaction batch แทน loop)
    for (const ad of ads) {
        const creative = ad.creative?.id ? creativeMap.get(ad.creative.id) : undefined;
        const postId = creative?.effective_object_story_id ?? creative?.object_story_id;
        const post = postId ? postMap.get(postId) : undefined;

        if (!postId || !post) {
            skipped++;
            continue; // ad นี้ไม่มี post ผูกอยู่ (เช่น dynamic creative ที่ไม่มี story id)
        }

        const adPost = await prisma.adPost.upsert({
            where: {
                companyId_platformId_externalPostId: {
                    companyId,
                    platformId,
                    externalPostId: postId,
                },
            },
            update: {
                message: post.message ?? null,
                permalink: post.permalink_url ?? null,
                publishedAt: post.created_time ? new Date(post.created_time) : null,
            },
            create: {
                companyId,
                platformId,
                externalPostId: postId,
                message: post.message ?? null,
                permalink: post.permalink_url ?? null,
                publishedAt: post.created_time ? new Date(post.created_time) : null,
            },
        });

        // 5. Update ads.post_id ให้ชี้ไปยัง ad_posts ที่เพิ่ง upsert
        //    ⚠️ ใช้ externalAdId เพื่อหา ad ในระบบเรา -- ปรับชื่อ field ให้ตรงถ้าไม่ใช่ชื่อนี้
        await prisma.ad.updateMany({
            where: { companyId, platformId, externalAdId: ad.id },
            data: { postId: adPost.id },
        });

        synced++;
    }

    return { synced, skipped };
}