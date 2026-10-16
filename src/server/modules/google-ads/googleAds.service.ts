import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE, buildGoogleAdsCredentials, createGoogleAdsClient, resolveGoogleAdsAppCredentials } from "./client";
import { CAMPAIGN_PERFORMANCE_QUERY } from "./googleAds.repository";
import { GoogleAdsCredentials } from "@/types/googleAds";
import { emptyPerformanceResponse, mapCampaignRowsToPerformance } from "./googleAds.mapper";
import { getCompanyById } from "@/server/modules/company/company.repository";

export async function getGoogleAdsApiPerformanceForCompany(companyId: bigint): Promise<ApiPerformanceResponse> {
    const company = await getCompanyById(companyId);
    if (company?.googleAdsRefreshToken && !resolveGoogleAdsAppCredentials(company)) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE,
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
    return getGoogleAdsApiPerformance(buildGoogleAdsCredentials(company));
}

// google-ads-api rejects with a GoogleAdsFailure ({ errors: [{ message }] }), not an Error instance.
export function describeGoogleAdsError(err: unknown): string {
    if (err instanceof Error) return err.message;
    const message = (err as { errors?: Array<{ message?: string }> } | null)?.errors?.find((e) => e.message)?.message;
    return message ?? "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Ads API";
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
            error: describeGoogleAdsError(err),
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
}
