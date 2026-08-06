"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyPlatformId } from "@/types/company";
import type { SpendTrendResponse } from "@/types/insights";

export function useSpendTrend(platform: CompanyPlatformId, dateFrom: string, dateTo: string) {
    const [data, setData] = useState<SpendTrendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrend = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ platform, dateFrom, dateTo });
            const response = await fetch(`/api/dashboard/insights/trend?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "ไม่สามารถโหลดข้อมูลเทรนด์ได้");
            }

            setData(result);
            setError(null);
        } catch (err) {
            setData(null);
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, [platform, dateFrom, dateTo]);

    useEffect(() => {
        void Promise.resolve().then(fetchTrend);
    }, [fetchTrend]);

    return { data, loading, error, refetch: fetchTrend };
}
