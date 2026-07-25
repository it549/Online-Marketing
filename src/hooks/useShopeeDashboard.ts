"use client";

import { useCallback, useEffect, useState } from "react";
import { ShopeeDashboardFilters, ShopeeDashboardResponse, ShopeePeriodGranularity } from "@/types/shopeeDashboard";

function buildQueryString(period: ShopeePeriodGranularity, filters: ShopeeDashboardFilters): string {
    const params = new URLSearchParams({ period });

    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.productId) params.set("productId", filters.productId);
    if (filters.campaignName) params.set("campaignName", filters.campaignName);
    if (filters.status) params.set("status", filters.status);

    return params.toString();
}

export function useShopeeDashboard() {
    const [period, setPeriod] = useState<ShopeePeriodGranularity>("week");
    const [filters, setFilters] = useState<ShopeeDashboardFilters>({});
    const [data, setData] = useState<ShopeeDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/shopee?${buildQueryString(period, filters)}`);
            const dashboard = await response.json();

            if (!response.ok) {
                throw new Error(dashboard.error);
            }

            setData(dashboard);
            setError(null);
        } catch (err) {
            setData(null);
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, [period, filters]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        period,
        setPeriod,
        filters,
        setFilters,
        refetch: fetchDashboard,
    };
}
