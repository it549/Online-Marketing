export interface FacebookContentRawRow {
    postId: string;
    pageId: string;
    pageName: string;
    title: string;
    durationSeconds: number;
    publishedAt: Date | null;
    permalink: string;
    postType: string;
    avgSecondsViewed: number | null;
    reach: number | null;
    reactions: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    newFollowers: number | null;
    viewers: number | null;
    views: number | null;
}

export interface FacebookContentParsedReport {
    rangeStartDate: Date | null;
    rangeEndDate: Date | null;
    rows: FacebookContentRawRow[];
}

export interface FacebookContentPostSummary {
    id: string;
    title: string;
    postType: string;
    publishedAt: Date | null;
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

export interface FacebookContentDashboardSummary {
    hasData: boolean;
    totalPosts: number;
    totalReach: number;
    totalViews: number;
    totalEngagement: number;
    posts: FacebookContentPostSummary[];
    breakdown: FacebookContentTypeBreakdown[];
}
