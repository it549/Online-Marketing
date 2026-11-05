"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

// Loaded once per page open and shared by every component (Shopee tab, Integrations) so switching tabs
// does not call Shopee again; only refetch() (sync button / disconnect) or a page reload asks for fresh data.
let sharedRequest: Promise<ApiPerformanceResponse> | null = null;

async function requestShopeeApiPerformance(): Promise<ApiPerformanceResponse> {
    const response = await fetch("/api/dashboard/shopee/api-performance");
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error ?? "เกิดข้อผิดพลาด");
    }

    return result;
}

export function useShopeeApiPerformance() {
    const [data, setData] = useState<ApiPerformanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (force: boolean) => {
        if (force || !sharedRequest) sharedRequest = requestShopeeApiPerformance();
        const request = sharedRequest;

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
    }, []);

    const refetch = useCallback(() => load(true), [load]);

    useEffect(() => {
        void Promise.resolve().then(() => load(false));
    }, [load]);

    return { data, loading, error, refetch };
}
