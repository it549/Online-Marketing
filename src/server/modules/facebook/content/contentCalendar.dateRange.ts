import type { ContentCalendarView } from "@/types/contentCalendar";

const BANGKOK_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * `publishedAt` stores the real UTC instant a post went live, but this business
 * groups by the Bangkok calendar day, so every bucket boundary below is computed
 * by shifting the instant +7h before reading Y/M/D/weekday (same trick as
 * getYesterdayInBangkok in etlDate.util.ts) -- unlike that helper, the boundaries
 * here are converted back to real UTC instants (not relabeled UTC-midnight dates)
 * since they're used directly as Prisma `gte`/`lt` bounds against a DateTime column.
 */
function bangkokDateParts(date: Date) {
    const shifted = new Date(date.getTime() + BANGKOK_UTC_OFFSET_MS);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth(),
        day: shifted.getUTCDate(),
        weekday: shifted.getUTCDay(), // 0 = Sunday
    };
}

function bangkokMidnightUtc(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month, day) - BANGKOK_UTC_OFFSET_MS);
}

/** "YYYY-MM-DD" for the Bangkok calendar day a real UTC instant falls into. */
export function bangkokDayKey(date: Date): string {
    const { year, month, day } = bangkokDateParts(date);
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "HH:MM" for the Bangkok local time of a real UTC instant. */
export function bangkokTimeLabel(date: Date): string {
    const shifted = new Date(date.getTime() + BANGKOK_UTC_OFFSET_MS);
    return `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
}

export function getDateRangeForView(view: ContentCalendarView, referenceDate: Date): { start: Date; end: Date } {
    const { year, month, day, weekday } = bangkokDateParts(referenceDate);

    if (view === "daily") {
        return { start: bangkokMidnightUtc(year, month, day), end: bangkokMidnightUtc(year, month, day + 1) };
    }

    if (view === "weekly") {
        const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
        return {
            start: bangkokMidnightUtc(year, month, day + diffToMonday),
            end: bangkokMidnightUtc(year, month, day + diffToMonday + 7),
        };
    }

    // monthly
    return { start: bangkokMidnightUtc(year, month, 1), end: bangkokMidnightUtc(year, month + 1, 1) };
}

/** Every Bangkok calendar day key in [start, end), in order -- so days with no posts still render. */
export function enumerateBangkokDayKeys(start: Date, end: Date): string[] {
    const keys: string[] = [];
    let cursor = start;

    while (cursor < end) {
        keys.push(bangkokDayKey(cursor));
        const { year, month, day } = bangkokDateParts(cursor);
        cursor = bangkokMidnightUtc(year, month, day + 1);
    }

    return keys;
}
