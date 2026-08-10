import { NormalizedContentPost } from "@/server/core/content-import/content-import.types";

import { FacebookContentRawRow } from "./facebookContent.types";
import type { FacebookPostAttachments, FacebookPostRow } from "../facebookEtl.repository";

/** Extracts image URLs from a Page post's attachments -- handles both a single photo/video (media.image.src) and an album/carousel (media.image.src nested under subattachments.data[]). */
function extractImageUrls(attachments?: FacebookPostAttachments): string[] {
    if (!attachments?.data) return [];

    const urls: string[] = [];
    for (const item of attachments.data) {
        if (item.media?.image?.src) urls.push(item.media.image.src);
        if (item.subattachments?.data) {
            for (const sub of item.subattachments.data) {
                if (sub.media?.image?.src) urls.push(sub.media.image.src);
            }
        }
    }
    return urls;
}

export function normalizeFacebookContentRow(row: FacebookContentRawRow): NormalizedContentPost {
    return {
        platformCode: "FACEBOOK",
        externalPostId: row.postId,
        pageExternalId: row.pageId || null,
        pageName: row.pageName || null,
        title: row.title || null,
        postType: row.postType || null,
        permalink: row.permalink || null,
        imageUrl: null,
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

const TITLE_PREVIEW_LENGTH = 80;

/**
 * Maps a live Graph API `/{page-id}/posts` row into the same NormalizedContentPost
 * shape the CSV import path produces, so both write into ContentPost/ContentPostMetric
 * via the same saveContentImportResult. The Graph API fields requested here
 * (PAGE_POST_FIELDS in facebookEtl.repository.ts) only cover shares -- likes.summary(true)
 * and comments.summary(true) return Graph API #10 with a Page-scoped token even with
 * pages_read_engagement granted, so reactions/comments stay null, same as reach/views/saves,
 * which have no live-fetch equivalent yet, same as CSV rows that never had that column.
 */
export function normalizeFacebookPagePost(row: FacebookPostRow, pageId: string): NormalizedContentPost {
    const imageUrls = extractImageUrls(row.attachments);

    return {
        platformCode: "FACEBOOK",
        externalPostId: row.id,
        pageExternalId: pageId,
        pageName: null,
        title: row.message ? row.message.slice(0, TITLE_PREVIEW_LENGTH) : null,
        postType: null,
        permalink: row.permalink_url ?? null,
        imageUrl: imageUrls[0] ?? null,
        publishedAt: row.created_time ? new Date(row.created_time) : null,
        durationSeconds: null,
        metrics: {
            avgSecondsViewed: null,
            reach: null,
            impressions: null,
            reactions: row.likes?.summary?.total_count ?? null,
            comments: row.comments?.summary?.total_count ?? null,
            shares: row.shares?.count ?? null,
            saves: null,
            newFollowers: null,
            viewers: null,
            views: null,
        },
    };
}
