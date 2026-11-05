import type { Company } from "@prisma/client";
import { config } from "@/server/configurations/config";
import type { GoogleAdsAppCredentials, GoogleAdsCredentials } from "@/types/googleAds";

/** Company's own OAuth client + developer token when fully set, otherwise the shared env ones. */
export function resolveGoogleAdsApp(company: Company | null): GoogleAdsAppCredentials {
    if (company?.googleAdsClientId && company.googleAdsClientSecret && company.googleAdsDeveloperToken) {
        return {
            clientId: company.googleAdsClientId,
            clientSecret: company.googleAdsClientSecret,
            developerToken: company.googleAdsDeveloperToken,
            loginCustomerId: company.googleAdsLoginCustomerId ?? undefined,
        };
    }
    return {
        clientId: config.google.clientID,
        clientSecret: config.google.clientSecret,
        developerToken: config.google.develoerToken,
        loginCustomerId: config.google.customerID,
    };
}

export function resolveGoogleAdsCredentials(company: Company | null): GoogleAdsCredentials | null {
    if (!company?.googleAdsCustomerId || !company.googleAdsRefreshToken) return null;
    return {
        customerId: company.googleAdsCustomerId,
        refreshToken: company.googleAdsRefreshToken,
        app: resolveGoogleAdsApp(company),
    };
}
