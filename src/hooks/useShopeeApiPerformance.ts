"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

// Loaded once per page open (per month) and shared by every component (Shopee tabs, Integrations) so switching tabs
// does not call Shopee again; only refetch() (sync button / disconnect) or a page reload asks for fresh data.
const sharedRequests = new Map<string, Promise<ApiPerformanceResponse>>();

/** Forget loaded months so the next mount fetches again (e.g. after product costs change). */
export function clearShopeeApiPerformanceCache() {
    sharedRequests.clear();
}

async function requestShopeeApiPerformance(month: string): Promise<ApiPerformanceResponse> {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    const response = await fetch(`/api/dashboard/shopee/api-performance${query}`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error ?? "เกิดข้อผิดพลาด");
    }

    return result;
}

/** `month` is "YYYY-MM"; empty/omitted = the default lookback since the ads started. */
export function useShopeeApiPerformance(month = "") {
    const [data, setData] = useState<ApiPerformanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (force: boolean) => {
            let request = sharedRequests.get(month);
            if (force || !request) {
                // A newly chosen month must not keep showing the previous month's numbers while it loads.
                if (!force) setData(null);
                request = requestShopeeApiPerformance(month);
                sharedRequests.set(month, request);
            }

            try {
                setLoading(true);
                setData(await request);
                setError(null);
            } catch (err) {
                setData(null);
                setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            } finally {
                setLoading(false);
            }
        },
        [month],
    );

    const refetch = useCallback(() => load(true), [load]);

    useEffect(() => {
        void Promise.resolve().then(() => load(false));
    }, [load]);

    return { data, loading, error, refetch };
}
