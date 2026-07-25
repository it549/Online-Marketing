import {
    FacebookContentDashboardResponse,
    FacebookContentImportBatch,
    FacebookContentPostSummary,
    FacebookContentTypeBreakdown,
} from "@/types/facebookContentDashboard";
import { getFacebookContentRepository, listFacebookContentImportJobs } from "./facebookContent.repository";

const UNSPECIFIED_POST_TYPE = "ไม่ระบุ";

export async function getFacebookContentAnalytics(importJobId?: string): Promise<FacebookContentDashboardResponse> {
    const [posts, importJobs] = await Promise.all([
        getFacebookContentRepository(importJobId),
        listFacebookContentImportJobs(),
    ]);

    const importBatches: FacebookContentImportBatch[] = importJobs.map((job) => ({
        id: job.id.toString(),
        filename: job.filename,
        importedAt: job.importedAt ? job.importedAt.toISOString() : null,
        totalRecords: job.totalRecords,
        periodLabel: formatPeriod(job.rangeStartDate, job.rangeEndDate),
    }));

    if (!posts || posts.length === 0) {
        return {
            hasData: false,
            totalPosts: 0,
            totalReach: 0,
            totalViews: 0,
            totalEngagement: 0,
            posts: [],
            breakdown: [],
            importBatches,
            selectedImportBatchId: importJobId ?? null,
        };
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
            publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
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

    return {
        hasData: true,
        totalPosts: postSummaries.length,
        totalReach: postSummaries.reduce((sum, post) => sum + post.reach, 0),
        totalViews: postSummaries.reduce((sum, post) => sum + post.views, 0),
        totalEngagement: postSummaries.reduce((sum, post) => sum + post.engagement, 0),
        posts: postSummaries,
        breakdown: Array.from(breakdownByType.values()).sort((a, b) => b.totalReach - a.totalReach),
        importBatches,
        selectedImportBatchId: importJobId ?? null,
    };
}

function formatPeriod(start: Date | null, end: Date | null): string | null {
    if (!start || !end) return null;

    const startLabel = start.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

    return `${startLabel} - ${endLabel}`;
}
