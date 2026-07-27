import { ApiPerformanceResponse } from "@/types/apiPerformance";

export interface TikTokAdsCredentials {
    advertiserId: string;
    accessToken: string;
}

/**
 * Scaffold only, same shape as the Facebook/Google Ads services: TikTok Ads API
 * also needs an App ID + App Secret (app-level, not per company) on top of the
 * advertiser id / access token here. Not provisioned yet, so this always reports
 * "not connected" until the real TikTok Business API call is wired in.
 */
export async function getTikTokApiPerformance(credentials: TikTokAdsCredentials | null): Promise<ApiPerformanceResponse> {
    if (!credentials) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: "ยังไม่ได้ตั้งค่า TikTok Advertiser ID สำหรับบริษัทนี้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }

    return {
        connected: false,
        lastSyncedAt: null,
        dateRangeLabel: null,
        error: "ตั้งค่า Advertiser ID ไว้แล้ว แต่ระบบยังไม่ได้เชื่อมต่อ TikTok Ads API จริง (รอ App ID และ App Secret)",
        metrics: [],
        table: { columns: [], rows: [] },
    };
}
