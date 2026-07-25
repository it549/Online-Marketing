import { ApiPerformanceResponse } from "@/types/apiPerformance";

// No live Shopee Open API integration exists yet in this codebase -- all
// Shopee data currently comes from CSV import (see shopeeDashboard.*). This
// honestly reports "not connected" rather than fabricating metrics, so the
// UI can distinguish "not implemented" from "implemented but erroring."
export async function getShopeeApiPerformance(): Promise<ApiPerformanceResponse> {
    return {
        connected: false,
        lastSyncedAt: null,
        dateRangeLabel: null,
        error: "ยังไม่ได้เชื่อมต่อ Shopee Open API (รอการเชื่อมต่อ) กรุณาใช้ข้อมูลจากไฟล์นำเข้าในแท็บ Imported Analytics",
        metrics: [],
        table: { columns: [], rows: [] },
    };
}
