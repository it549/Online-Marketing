import type { ContentCalendarDay, ContentCalendarPost, ContentCalendarResponse, ContentCalendarView } from "@/types/contentCalendar";
import { getContentPostsInRange } from "./facebookContent.repository";
import { bangkokDayKey, bangkokTimeLabel, enumerateBangkokDayKeys, getDateRangeForView } from "./contentCalendar.dateRange";

const TITLE_PREVIEW_LENGTH = 80;

export async function getContentCalendar(
    companyId: bigint,
    view: ContentCalendarView,
    referenceDate: Date,
): Promise<ContentCalendarResponse> {
    const { start, end } = getDateRangeForView(view, referenceDate);
    const posts = await getContentPostsInRange(companyId, start, end);

    const postsByDay = new Map<string, ContentCalendarPost[]>();
    for (const key of enumerateBangkokDayKeys(start, end)) {
        postsByDay.set(key, []);
    }

    for (const post of posts) {
        if (!post.publishedAt) continue;

        const dayKey = bangkokDayKey(post.publishedAt);
        const bucket = postsByDay.get(dayKey);
        if (!bucket) continue; // outside the enumerated range (shouldn't happen given the query filter)

        bucket.push({
            id: post.id.toString(),
            title: post.title ? post.title.slice(0, TITLE_PREVIEW_LENGTH) : "(ไม่มีข้อความ)",
            imageUrl: post.imageUrl,
            permalink: post.permalink,
            publishedAt: post.publishedAt.toISOString(),
            time: bangkokTimeLabel(post.publishedAt),
            reach: post.metric?.reach ?? null,
            comments: post.metric?.comments ?? null,
        });
    }

    const days: ContentCalendarDay[] = Array.from(postsByDay.entries()).map(([date, dayPosts]) => ({
        date,
        posts: dayPosts,
    }));

    return {
        view,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        days,
        hasData: posts.length > 0,
    };
}
