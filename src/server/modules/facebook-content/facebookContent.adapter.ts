import { NormalizedContentPost } from "@/server/core/content-import/content-import.types";

import { FacebookContentRawRow } from "./facebookContent.types";

export function normalizeFacebookContentRow(row: FacebookContentRawRow): NormalizedContentPost {
    return {
        platformCode: "FACEBOOK",
        externalPostId: row.postId,
        pageExternalId: row.pageId || null,
        pageName: row.pageName || null,
        title: row.title || null,
        postType: row.postType || null,
        permalink: row.permalink || null,
        publishedAt: row.publishedAt,
        durationSeconds: row.durationSeconds,
        metrics: {
            avgSecondsViewed: row.avgSecondsViewed,
            reach: row.reach,
            impressions: null,
            reactions: row.reactions,
            comments: row.comments,
            shares: row.shares,
            saves: row.saves,
            newFollowers: row.newFollowers,
            viewers: row.viewers,
            views: row.views,
        },
    };
}

export function normalizeFacebookContentRows(rows: FacebookContentRawRow[]): NormalizedContentPost[] {
    return rows.map(normalizeFacebookContentRow);
}
