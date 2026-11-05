"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyPlatformId } from "@/types/company";
import type { AudienceBreakdownResponse, BreakdownDimension } from "@/types/insights";

export function useAudienceBreakdown(
    platform: CompanyPlatformId,
    dimension: BreakdownDimension,
    dateFrom: string,
    dateTo: string,
    /** Bump this (e.g. after a manual ETL sync) to force a refetch without changing the query itself. */
    refreshToken?: number,
) {
    const [data, setData] = useState<AudienceBreakdownResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBreakdown = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ platform, dimension, dateFrom, dateTo });
            const response = await fetch(`/api/dashboard/insights/breakdown?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "ไม่สามารถโหลดข้อมูลกลุ่มเป้าหมายได้");
            }

            setData(result);
            setError(null);
        } catch (err) {
            setData(null);
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, [platform, dimension, dateFrom, dateTo]);

    useEffect(() => {
        // Pre-existing fetch-on-mount/dependency-change pattern shared by every data hook in
        // this codebase (useSpendTrend, useFacebookApiPerformance, ...) -- not specific to this file.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBreakdown();
    }, [fetchBreakdown, refreshToken]);

    return { data, loading, error, refetch: fetchBreakdown };
}
