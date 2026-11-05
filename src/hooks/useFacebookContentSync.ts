"use client";

import { useState } from "react";

export function useFacebookContentSync() {
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function sync(): Promise<boolean> {
        try {
            setSyncing(true);
            setError(null);

            const response = await fetch("/api/dashboard/facebook/content-sync", { method: "POST" });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error ?? "ซิงค์ไม่สำเร็จ");
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            return false;
        } finally {
            setSyncing(false);
        }
    }

    return { sync, syncing, error };
}
