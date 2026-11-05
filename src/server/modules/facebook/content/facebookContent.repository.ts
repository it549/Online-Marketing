import { prisma } from "@/server/database/prisma";
import type { FacebookPostAd } from "@/types/facebookContentDashboard";
import type { CampaignDetailPost } from "@/types/campaigns";

const FACEBOOK_CONTENT_PLATFORM_CODE = "FACEBOOK";

export async function getFacebookContentRepository(companyId: bigint, importJobId?: string) {
    const platform = await prisma.contentPlatform.findUnique({
        where: { code: FACEBOOK_CONTENT_PLATFORM_CODE },
    });

    if (!platform) {
        return null;
    }

    const posts = await prisma.contentPost.findMany({
        where: {
            companyId,
            platformId: platform.id,
            ...(importJobId ? { lastImportJobId: BigInt(importJobId) } : {}),
        },
        include: { metric: true },
    });

    return posts;
}

/** All content posts (any platform) published within [start, end) -- backs the content calendar view. */
export async function getContentPostsInRange(companyId: bigint, start: Date, end: Date) {
    return prisma.contentPost.findMany({
        where: { companyId, publishedAt: { gte: start, lt: end } },
        include: { metric: true },
        orderBy: { publishedAt: "asc" },
    });
}

export async function listFacebookContentImportJobs(companyId: bigint) {
    const platform = await prisma.contentPlatform.findUnique({
        where: { code: FACEBOOK_CONTENT_PLATFORM_CODE },
    });

    if (!platform) {
        return [];
    }

    return prisma.contentImportJob.findMany({
        where: { companyId, platformId: platform.id, status: "COMPLETED" },
        orderBy: { importedAt: "desc" },
    });
}

/**
 * Primary Content-tab data source: ad_posts pulled via the ads ETL
 * (ad -> creative -> effective_object_story_id -> post, see
 * facebookEtl.service.ts's resolveFacebookAdPosts) using the ad-account
 * access token. Unlike the Page-posts live sync / CSV import path, this
 * requires no `pages_read_engagement` permission -- it's the same token
 * already used for campaigns/ads/insights.
 */
export async function getAdPostsForCompany(companyId: bigint) {
    const adPosts = await prisma.adPost.findMany({
        where: { companyId },
        include: { ads: { include: { campaign: true } } },
        orderBy: { publishedAt: "desc" },
    });

    const adIds = adPosts.flatMap((adPost) => adPost.ads.map((ad) => ad.id));

    const insightTotals = adIds.length > 0
        ? await prisma.adInsight.groupBy({
            by: ["entityId"],
            where: { companyId, entityLevel: "AD", entityId: { in: adIds } },
            _sum: { spend: true, reach: true, clicks: true },
        })
        : [];

    const totalsByAdId = new Map(insightTotals.map((row) => [row.entityId.toString(), row._sum]));

    return adPosts.map((adPost) => {
        const ads: FacebookPostAd[] = adPost.ads.map((ad) => {
            const totals = totalsByAdId.get(ad.id.toString());

            return {
                adId: ad.id.toString(),
                adName: ad.name,
                campaignId: ad.campaign.id.toString(),
                campaignName: ad.campaign.campaignName,
                status: ad.status,
                spend: Number(totals?.spend ?? 0),
                reach: totals?.reach ?? 0,
                clicks: totals?.clicks ?? 0,
            };
        });

        return { adPost, ads };
    });
}

/**
 * Cross-references content posts (imported from CSV) against ad_posts (pulled
 * via the ads ETL, see facebookEtl.service.ts's resolveFacebookAdPosts) by
 * Facebook's post id -- both tables key on the same real-world post, just
 * reached through different pipelines, so no shared FK exists between them.
 * Returns the ad(s) + all-time spend/reach/clicks (from the ETL-synced
 * AdInsight table) backing each post, so the Content tab can show which
 * campaign is promoting a post and what it has spent, not just a yes/no flag.
 */
export async function getAdvertisingAdsByExternalPostId(
    companyId: bigint,
    externalPostIds: string[],
): Promise<Map<string, FacebookPostAd[]>> {
    if (externalPostIds.length === 0) return new Map();

    const adPosts = await prisma.adPost.findMany({
        where: { companyId, externalPostId: { in: externalPostIds } },
        include: { ads: { include: { campaign: true } } },
    });

    const adIds = adPosts.flatMap((adPost) => adPost.ads.map((ad) => ad.id));

    const insightTotals = adIds.length > 0
        ? await prisma.adInsight.groupBy({
            by: ["entityId"],
            where: { companyId, entityLevel: "AD", entityId: { in: adIds } },
            _sum: { spend: true, reach: true, clicks: true },
        })
        : [];

    const totalsByAdId = new Map(insightTotals.map((row) => [row.entityId.toString(), row._sum]));

    const result = new Map<string, FacebookPostAd[]>();

    for (const adPost of adPosts) {
        const ads: FacebookPostAd[] = adPost.ads.map((ad) => {
            const totals = totalsByAdId.get(ad.id.toString());

            return {
                adId: ad.id.toString(),
                adName: ad.name,
                campaignId: ad.campaign.id.toString(),
                campaignName: ad.campaign.campaignName,
                status: ad.status,
                spend: Number(totals?.spend ?? 0),
                reach: totals?.reach ?? 0,
                clicks: totals?.clicks ?? 0,
            };
        });

        result.set(adPost.externalPostId, ads);
    }

    return result;
}

/**
 * Inverse of getAdvertisingAdsByExternalPostId: given a campaign, find every
 * post its ads are boosting, with spend/reach/clicks summed per post (an
 * AdSet/ad structure can point multiple ads at the same creative/post).
 */
export async function getCampaignDetailByExternalCampaignId(companyId: bigint, externalCampaignId: string) {
    const campaign = await prisma.campaign.findFirst({
        where: { companyId, externalCampaignId, platform: { code: "META" } },
        include: { ads: { include: { post: true } } },
    });

    if (!campaign) return null;

    const adsWithPost = campaign.ads.filter((ad) => ad.post !== null);
    const adIds = adsWithPost.map((ad) => ad.id);

    const insightTotals = adIds.length > 0
        ? await prisma.adInsight.groupBy({
            by: ["entityId"],
            where: { companyId, entityLevel: "AD", entityId: { in: adIds } },
            _sum: { spend: true, reach: true, clicks: true },
        })
        : [];

    const totalsByAdId = new Map(insightTotals.map((row) => [row.entityId.toString(), row._sum]));

    const postsById = new Map<string, CampaignDetailPost & { adNames: string[] }>();

    for (const ad of adsWithPost) {
        const post = ad.post!;
        const totals = totalsByAdId.get(ad.id.toString());
        const spend = Number(totals?.spend ?? 0);
        const reach = totals?.reach ?? 0;
        const clicks = totals?.clicks ?? 0;

        const existing = postsById.get(post.externalPostId);

        if (existing) {
            existing.spend += spend;
            existing.reach += reach;
            existing.clicks += clicks;
            existing.adNames.push(ad.name);
        } else {
            postsById.set(post.externalPostId, {
                postId: post.externalPostId,
                message: post.message,
                permalink: post.permalink,
                publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
                adName: ad.name,
                adNames: [ad.name],
                spend,
                reach,
                clicks,
            });
        }
    }

    const posts: CampaignDetailPost[] = Array.from(postsById.values()).map(({ adNames, ...post }) => ({
        ...post,
        adName: adNames.length > 1 ? `${adNames[0]} +${adNames.length - 1} โฆษณา` : adNames[0],
    }));

    return {
        campaign,
        posts,
    };
}
