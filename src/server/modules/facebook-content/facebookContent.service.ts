import { FacebookContentDashboardSummary, FacebookContentPostSummary, FacebookContentTypeBreakdown } from "./facebookContent.types";
import { getFacebookContentRepository } from "./facebookContent.repository";
import { mapFacebookContentDashboard } from "./facebookContent.mapper";

const UNSPECIFIED_POST_TYPE = "ไม่ระบุ";

export async function getFacebookContentDashboard() {
    const posts = await getFacebookContentRepository();

    if (!posts || posts.length === 0) {
        return mapFacebookContentDashboard(buildEmptySummary());
    }

    const postSummaries: FacebookContentPostSummary[] = posts.map((post) => {
        const reach = post.metric?.reach ?? 0;
        const views = post.metric?.views ?? 0;
        const reactions = post.metric?.reactions ?? 0;
        const comments = post.metric?.comments ?? 0;
        const shares = post.metric?.shares ?? 0;

        return {
            id: post.id.toString(),
            title: post.title ?? post.externalPostId,
            postType: post.postType ?? UNSPECIFIED_POST_TYPE,
            publishedAt: post.publishedAt,
            reach,
            views,
            reactions,
            comments,
            shares,
            engagement: reactions + comments + shares,
        };
    });

    postSummaries.sort((a, b) => b.reach - a.reach);

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

    const summary: FacebookContentDashboardSummary = {
        hasData: true,
        totalPosts: postSummaries.length,
        totalReach: postSummaries.reduce((sum, post) => sum + post.reach, 0),
        totalViews: postSummaries.reduce((sum, post) => sum + post.views, 0),
        totalEngagement: postSummaries.reduce((sum, post) => sum + post.engagement, 0),
        posts: postSummaries,
        breakdown: Array.from(breakdownByType.values()).sort((a, b) => b.totalReach - a.totalReach),
    };

    return mapFacebookContentDashboard(summary);
}

function buildEmptySummary(): FacebookContentDashboardSummary {
    return {
        hasData: false,
        totalPosts: 0,
        totalReach: 0,
        totalViews: 0,
        totalEngagement: 0,
        posts: [],
        breakdown: [],
    };
}
