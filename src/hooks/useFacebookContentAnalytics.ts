"use client";

import { useCallback, useEffect, useState } from "react";
import { FacebookContentDashboardResponse } from "@/types/facebookContentDashboard";

export function useFacebookContentAnalytics() {
    const [data, setData] = useState<FacebookContentDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [importJobId, setImportJobId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const query = importJobId ? `?importJobId=${importJobId}` : "";
            const response = await fetch(`/api/dashboard/facebook/content-analytics${query}`);
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
    }, [importJobId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, importJobId, setImportJobId, refetch: fetchData };
}
