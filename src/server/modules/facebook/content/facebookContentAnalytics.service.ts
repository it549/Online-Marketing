import {
    FacebookContentDashboardResponse,
    FacebookContentPostSummary,
    FacebookContentTypeBreakdown,
} from "@/types/facebookContentDashboard";
import { CampaignDetailResponse } from "@/types/campaigns";
import {
    getAdPostsForCompany,
    getCampaignDetailByExternalCampaignId,
} from "./facebookContent.repository";

const ADVERTISED_POST_TYPE = "โฆษณา";

export async function getFacebookContentAnalytics(companyId: bigint): Promise<FacebookContentDashboardResponse> {
    const adPosts = await getAdPostsForCompany(companyId);

    if (adPosts.length === 0) {
        return {
            hasData: false,
            totalPosts: 0,
            totalReach: 0,
            totalViews: 0,
            totalReactions: 0,
            totalEngagement: 0,
            totalAdvertisedPosts: 0,
            posts: [],
            breakdown: [],
            importBatches: [],
            selectedImportBatchId: null,
        };
    }

    const postSummaries: FacebookContentPostSummary[] = adPosts.map(({ adPost, ads }) => {
        const reactions = adPost.likeCount ?? 0;
        const comments = adPost.commentCount ?? 0;
        const shares = adPost.shareCount ?? 0;

        return {
            id: adPost.id.toString(),
            title: adPost.message ?? adPost.externalPostId,
            postType: ADVERTISED_POST_TYPE,
            publishedAt: adPost.publishedAt ? adPost.publishedAt.toISOString() : null,
            reach: 0,
            views: 0,
            reactions,
            comments,
            shares,
            engagement: reactions + comments + shares,
            isAdvertised: ads.length > 0,
            advertisingAds: ads,
        };
    });

    postSummaries.sort((a, b) => b.engagement - a.engagement);

    const breakdownByType = new Map<string, FacebookContentTypeBreakdown>();

    for (const post of postSummaries) {
        const existing = breakdownByType.get(post.postType);

        if (existing) {
            existing.postCount += 1;
            existing.totalReach += post.reach;
            existing.totalEngagement += post.engagement;
        } else {
            breakdownByType.set(post.postType, {
                postType: post.postType,
                postCount: 1,
                totalReach: post.reach,
                totalEngagement: post.engagement,
            });
        }
    }

    return {
        hasData: true,
        totalPosts: postSummaries.length,
        totalReach: postSummaries.reduce((sum, post) => sum + post.reach, 0),
        totalViews: postSummaries.reduce((sum, post) => sum + post.views, 0),
        totalReactions: postSummaries.reduce((sum, post) => sum + post.reactions, 0),
        totalEngagement: postSummaries.reduce((sum, post) => sum + post.engagement, 0),
        totalAdvertisedPosts: postSummaries.filter((post) => post.isAdvertised).length,
        posts: postSummaries,
        breakdown: Array.from(breakdownByType.values()).sort((a, b) => b.totalReach - a.totalReach),
        importBatches: [],
        selectedImportBatchId: null,
    };
}

export async function getFacebookCampaignDetail(companyId: bigint, externalCampaignId: string): Promise<CampaignDetailResponse | null> {
    const result = await getCampaignDetailByExternalCampaignId(companyId, externalCampaignId);
    if (!result) return null;

    const isActive = result.campaign.campaignStatus === "ACTIVE";

    return {
        campaignName: result.campaign.campaignName,
        statusLabel: isActive ? "กำลังทำงาน" : "หยุดชั่วคราว",
        statusTone: isActive ? "positive" : "neutral",
        posts: result.posts,
    };
}
