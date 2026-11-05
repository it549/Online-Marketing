"use client";

import { useCallback, useState } from "react";
import type { CompanyPlatformId } from "@/types/company";

export function useEtlSync() {
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sync = useCallback(async (platform: CompanyPlatformId): Promise<boolean> => {
        try {
            setSyncing(true);
            setError(null);

            const response = await fetch("/api/dashboard/insights/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform }),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error ?? "ซิงค์ไม่สำเร็จ");
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            return false;
        } finally {
            setSyncing(false);
        }
    }, []);

    return { sync, syncing, error };
}
