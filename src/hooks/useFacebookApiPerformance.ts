"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

export function useFacebookApiPerformance() {
    const [data, setData] = useState<ApiPerformanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/dashboard/facebook/api-performance");
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
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
