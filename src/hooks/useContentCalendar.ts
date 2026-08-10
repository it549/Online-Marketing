"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentCalendarResponse, ContentCalendarView } from "@/types/contentCalendar";

/**
 * Nudges the reference date by one view-sized step using UTC setters (not local
 * setDate/setMonth) so the shift is deterministic regardless of the browser's
 * timezone -- the server re-derives the actual Bangkok day/week/month boundaries
 * from the resulting instant (see contentCalendar.dateRange.ts).
 */
function shiftReferenceDate(date: Date, view: ContentCalendarView, direction: "prev" | "next"): Date {
    const delta = direction === "next" ? 1 : -1;
    const next = new Date(date);

    if (view === "daily") next.setUTCDate(next.getUTCDate() + delta);
    else if (view === "weekly") next.setUTCDate(next.getUTCDate() + delta * 7);
    else next.setUTCMonth(next.getUTCMonth() + delta);

    return next;
}

export function useContentCalendar() {
    const [view, setView] = useState<ContentCalendarView>("weekly");
    const [referenceDate, setReferenceDate] = useState(() => new Date());
    const [data, setData] = useState<ContentCalendarResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ view, date: referenceDate.toISOString() });
            const response = await fetch(`/api/dashboard/content/calendar?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "เกิดข้อผิดพลาด");
            }

            setData(result);
            setError(null);
        } catch (err) {
            setData(null);
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, [view, referenceDate]);

    useEffect(() => {
        void Promise.resolve().then(fetchData);
    }, [fetchData]);

    function navigate(direction: "prev" | "next") {
        setReferenceDate((current) => shiftReferenceDate(current, view, direction));
    }

    function goToToday() {
        setReferenceDate(new Date());
    }

    return { view, setView, referenceDate, navigate, goToToday, data, loading, error, refetch: fetchData };
}
