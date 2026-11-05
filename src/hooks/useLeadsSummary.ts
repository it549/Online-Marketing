"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyPlatformId } from "@/types/company";
import type { LeadsResponse } from "@/types/insights";

export function useLeadsSummary(platform: CompanyPlatformId, dateFrom: string, dateTo: string) {
    const [data, setData] = useState<LeadsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ platform, dateFrom, dateTo });
            const response = await fetch(`/api/dashboard/insights/leads?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "ไม่สามารถโหลดข้อมูลลูกค้าที่สนใจได้");
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
        void Promise.resolve().then(fetchLeads);
    }, [fetchLeads]);

    return { data, loading, error, refetch: fetchLeads };
}
