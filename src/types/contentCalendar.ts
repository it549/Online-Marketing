export type ContentCalendarView = "daily" | "weekly" | "monthly";

export interface ContentCalendarPost {
    id: string;
    title: string;
    imageUrl: string | null;
    permalink: string | null;
    publishedAt: string; // ISO instant
    time: string; // "HH:MM", Bangkok local
    reach: number | null;
    comments: number | null;
}

export interface ContentCalendarDay {
    date: string; // "YYYY-MM-DD", Bangkok calendar day
    posts: ContentCalendarPost[];
}

export interface ContentCalendarResponse {
    view: ContentCalendarView;
    rangeStart: string; // ISO instant
    rangeEnd: string; // ISO instant
    days: ContentCalendarDay[];
    hasData: boolean;
}
