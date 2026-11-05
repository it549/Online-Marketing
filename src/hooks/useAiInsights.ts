"use client";

import { useCallback, useState } from "react";
import { AiInsightsResponse } from "@/types/aiInsights";

export function useAiInsights(endpoint: string) {
    const [data, setData] = useState<AiInsightsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(endpoint, { method: "POST" });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "ไม่สามารถวิเคราะห์ข้อมูลได้");
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    return { data, loading, error, generate };
}
