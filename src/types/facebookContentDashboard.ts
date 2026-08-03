export interface FacebookContentPostSummary {
    id: string;
    title: string;
    postType: string;
    publishedAt: string | null;
    reach: number;
    views: number;
    reactions: number;
    comments: number;
    shares: number;
    engagement: number;
}

export interface FacebookContentTypeBreakdown {
    postType: string;
    postCount: number;
    totalReach: number;
    totalEngagement: number;
}

export interface FacebookContentImportBatch {
    id: string;
    filename: string;
    importedAt: string | null;
    totalRecords: number;
    periodLabel: string | null;
}

export interface FacebookContentDashboardResponse {
    hasData: boolean;
    totalPosts: number;
    totalReach: number;
    totalViews: number;
    totalReactions: number;
    totalEngagement: number;
    posts: FacebookContentPostSummary[];
    breakdown: FacebookContentTypeBreakdown[];
    importBatches: FacebookContentImportBatch[];
    selectedImportBatchId: string | null;
}
