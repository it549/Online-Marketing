import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { createGoogleAdsClient } from "./client";
import { CAMPAIGN_PERFORMANCE_QUERY } from "./googleAds.repository";
import { GoogleAdsCredentials } from "@/types/googleAds";
import { emptyPerformanceResponse, mapCampaignRowsToPerformance } from "./googleAds.mapper";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { resolveGoogleAdsCredentials } from "./googleAdsCredentials";

export async function getGoogleAdsApiPerformanceForCompany(companyId: bigint): Promise<ApiPerformanceResponse> {
    return getGoogleAdsApiPerformance(resolveGoogleAdsCredentials(await getCompanyById(companyId)));
}

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
        const customer = createGoogleAdsClient(credentials.app).Customer({
            customer_id: credentials.customerId,
            refresh_token: credentials.refreshToken,
            login_customer_id: credentials.app.loginCustomerId,
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
            error:
                (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ??
                (err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Ads API"),
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
}
