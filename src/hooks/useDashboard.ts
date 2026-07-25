"use client";

import { useCallback, useEffect, useState } from "react";
import { Platform } from "@/types/platform";
import { DashboardData } from "@/types/dashboard";

export function useDashboard(platform: Platform) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard?platform=${platform}`);
            const dashboard = await response.json();

            if (!response.ok) {
                throw new Error(dashboard.error);
            }

            setData(dashboard);
            setError(null);
        } catch (error) {
            setData(null);
            setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, [platform]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        refetch: fetchDashboard,
    };
}
