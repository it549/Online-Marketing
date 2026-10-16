import { GoogleAdsApi } from "google-ads-api";
import type { Company } from "@prisma/client";
import type { GoogleAdsAppCredentials, GoogleAdsCredentials } from "@/types/googleAds";

type AppCredentialFields = Pick<Company, "googleAdsClientId" | "googleAdsClientSecret" | "googleAdsDeveloperToken" | "googleAdsLoginCustomerId">;

export const GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE =
    "ยังไม่ได้ตั้งค่า API ของบริษัทนี้ (Client ID, Client Secret, Developer Token, MCC ID)";

/**
 * Each company owns its Google Ads app credentials -- nothing is shared through env, so one
 * company's token/MCC can never be used for another. Returns null until all four are set.
 */
export function resolveGoogleAdsAppCredentials(company: AppCredentialFields | null): GoogleAdsAppCredentials | null {
    if (!company?.googleAdsClientId || !company.googleAdsClientSecret || !company.googleAdsDeveloperToken || !company.googleAdsLoginCustomerId) {
        return null;
    }
    return {
        clientId: company.googleAdsClientId,
        clientSecret: company.googleAdsClientSecret,
        developerToken: company.googleAdsDeveloperToken,
        loginCustomerId: company.googleAdsLoginCustomerId,
    };
}

export function createGoogleAdsClient(app: GoogleAdsAppCredentials): GoogleAdsApi {
    return new GoogleAdsApi({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        developer_token: app.developerToken,
    });
}

export function buildGoogleAdsCredentials(
    company: (AppCredentialFields & Pick<Company, "googleAdsCustomerId" | "googleAdsRefreshToken">) | null,
): GoogleAdsCredentials | null {
    const app = resolveGoogleAdsAppCredentials(company);
    if (!company?.googleAdsCustomerId || !company.googleAdsRefreshToken || !app) return null;
    return { customerId: company.googleAdsCustomerId, refreshToken: company.googleAdsRefreshToken, app };
}
