import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { config } from "@/server/configurations/config";
import { googleAdsClient } from "./client";
import { CAMPAIGN_PERFORMANCE_QUERY } from "./googleAds.repository";
import { GoogleAdsCredentials } from "@/types/googleAds";
import { emptyPerformanceResponse, mapCampaignRowsToPerformance } from "./googleAds.mapper";

export async function getGoogleAdsApiPerformance(
    credentials: GoogleAdsCredentials | null
): Promise<ApiPerformanceResponse> {
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

    try {
        const customer = googleAdsClient.Customer({
            customer_id: credentials.customerId,
            refresh_token: credentials.refreshToken,
            login_customer_id: config.google.customerID,
        });

        const rows = await customer.query(CAMPAIGN_PERFORMANCE_QUERY);

        return rows.length === 0
            ? emptyPerformanceResponse()
            : mapCampaignRowsToPerformance(rows);
    } catch (err) {
        console.error("Google Ads API error:", err);
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Ads API",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
}