const BANGKOK_UTC_OFFSET_HOURS = 7;

/**
 * Returns "yesterday" as a UTC-midnight Date representing the Bangkok (UTC+7)
 * calendar day before `reference`. Cron-triggered functions may run in UTC, so this
 * must not rely on server-local time to decide which day "yesterday" means.
 */
export function getYesterdayInBangkok(reference: Date = new Date()): Date {
    const bangkokMs = reference.getTime() + BANGKOK_UTC_OFFSET_HOURS * 60 * 60 * 1000;
    const bangkokNow = new Date(bangkokMs);

    return new Date(
        Date.UTC(bangkokNow.getUTCFullYear(), bangkokNow.getUTCMonth(), bangkokNow.getUTCDate() - 1),
    );
}

/**
 * Returns "today" as a UTC-midnight Date representing the current Bangkok (UTC+7)
 * calendar day. Used for on-demand manual syncs -- the daily cron deliberately only
 * ever pulls "yesterday" (see getYesterdayInBangkok) since same-day platform metrics
 * are still provisional, but a manual "sync now" trades that stability for freshness.
 */
export function getTodayInBangkok(reference: Date = new Date()): Date {
    const bangkokMs = reference.getTime() + BANGKOK_UTC_OFFSET_HOURS * 60 * 60 * 1000;
    const bangkokNow = new Date(bangkokMs);

    return new Date(Date.UTC(bangkokNow.getUTCFullYear(), bangkokNow.getUTCMonth(), bangkokNow.getUTCDate()));
}

/** Formats a UTC-midnight Date as "YYYY-MM-DD" for platform API date params. */
export function formatDateParam(date: Date): string {
    return date.toISOString().slice(0, 10);
}
