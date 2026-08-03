import { ApiPerformanceResponse } from "@/types/apiPerformance";

export interface GoogleAdsCredentials {
    customerId: string;
    refreshToken: string;
}

/**
 * Scaffold only: Google Ads API needs a Developer Token + OAuth client (app-level,
 * not stored per company) on top of the per-company customer id / refresh token.
 * Those app-level credentials aren't provisioned yet, so this always reports
 * "not connected" until the real Google Ads API call is wired in.
 */
export async function getGoogleAdsApiPerformance(credentials: GoogleAdsCredentials | null): Promise<ApiPerformanceResponse> {
    if (!credentials) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: "ยังไม่ได้ตั้งค่า Google Ads Customer ID สำหรับบริษัทนี้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }

    return {
        connected: false,
        lastSyncedAt: null,
        dateRangeLabel: null,
        error: "ตั้งค่า Customer ID ไว้แล้ว แต่ระบบยังไม่ได้เชื่อมต่อ Google Ads API จริง (รอ Developer Token และ OAuth Client)",
        metrics: [],
        table: { columns: [], rows: [] },
    };
}
