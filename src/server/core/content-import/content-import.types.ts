export type ContentPlatformCode = "FACEBOOK";

export interface NormalizedContentPostMetrics {
    avgSecondsViewed: number | null;
    reach: number | null;
    impressions: number | null;
    reactions: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    newFollowers: number | null;
    viewers: number | null;
    views: number | null;
}

export interface NormalizedContentPost {
    platformCode: ContentPlatformCode;
    externalPostId: string;
    pageExternalId: string | null;
    pageName: string | null;
    title: string | null;
    postType: string | null;
    permalink: string | null;
    publishedAt: Date | null;
    durationSeconds: number | null;
    metrics: NormalizedContentPostMetrics;
}

export interface NormalizedContentImportResult {
    platformCode: ContentPlatformCode;
    fileName: string;
    rangeStartDate: Date | null;
    rangeEndDate: Date | null;
    posts: NormalizedContentPost[];
}
