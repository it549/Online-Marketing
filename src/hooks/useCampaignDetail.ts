"use client";

import { useEffect, useState } from "react";
import { CampaignDetailResponse } from "@/types/campaigns";

export function useCampaignDetail(campaignId: string | null) {
    const [data, setData] = useState<CampaignDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!campaignId) return;

        let cancelled = false;

        async function fetchDetail() {
            try {
                setLoading(true);
                const response = await fetch(`/api/dashboard/campaigns/${campaignId}`);
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error ?? "เกิดข้อผิดพลาด");
                }

                if (!cancelled) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setData(null);
                    setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void fetchDetail();

        return () => {
            cancelled = true;
        };
    }, [campaignId]);

    return { data, loading, error };
}
