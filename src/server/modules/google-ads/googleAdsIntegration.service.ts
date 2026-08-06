import { config } from "@/server/configurations/config";
import { updateGoogleAdsConnection, clearGoogleAdsConnection } from "@/server/modules/company/company.repository";

const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const GOOGLE_ADS_API_VERSION = "v24";

export type GoogleAdsConnectionResult =
    | { ok: true; customerId: string; customerCount: number }
    | { ok: false; message: string };

export function createGoogleAdsAuthorizationUrl(state: string): string {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", config.google.clientID);
    authUrl.searchParams.set("redirect_uri", config.google.redirectUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_ADS_SCOPE);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);
    return authUrl.toString();
}

export async function connectGoogleAdsAccount(
    companyId: bigint,
    authorizationCode: string,
): Promise<GoogleAdsConnectionResult> {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code: authorizationCode,
            client_id: config.google.clientID,
            client_secret: config.google.clientSecret,
            redirect_uri: config.google.redirectUrl,
            grant_type: "authorization_code",
        }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.refresh_token || !tokenData.access_token) {
        return { ok: false, message: "Google did not return the required access credentials." };
    }

    const customersResponse = await fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}`, "developer-token": config.google.develoerToken } },
    );
    const customersData = await customersResponse.json();
    if (!customersResponse.ok) {
        const message = customersData?.error?.details
            ?.flatMap((detail: { errors?: Array<{ message?: string }> }) => detail.errors ?? [])
            ?.find((error: { message?: string }) => error.message)?.message;
        return { ok: false, message: message ?? "Unable to load accessible Google Ads accounts." };
    }

    const customerIds = (customersData.resourceNames as string[] | undefined ?? [])
        .map((resourceName) => resourceName.replace("customers/", ""));
    if (!customerIds.length) return { ok: false, message: "No accessible Google Ads account was found." };

    await updateGoogleAdsConnection(companyId, {
        customerId: customerIds[0],
        refreshToken: tokenData.refresh_token,
    });
    return { ok: true, customerId: customerIds[0], customerCount: customerIds.length };
}

export function disconnectGoogleAdsAccount(companyId: bigint): Promise<void> {
    return clearGoogleAdsConnection(companyId);
}
