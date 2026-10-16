import { config } from "@/server/configurations/config";
import { updateGoogleAdsConnection, clearGoogleAdsConnection, getCompanyById, setGoogleAdsCustomerId } from "@/server/modules/company/company.repository";
import type { Company } from "@prisma/client";
import { GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE, createGoogleAdsClient, resolveGoogleAdsAppCredentials } from "./client";
import { describeGoogleAdsError } from "./googleAds.service";

const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const GOOGLE_ADS_API_VERSION = "v24";

export type GoogleAdsConnectionResult =
    | { ok: true; customerId: string; customerCount: number }
    | { ok: false; message: string };

export function createGoogleAdsAuthorizationUrl(state: string, company: Company | null): string | null {
    const app = resolveGoogleAdsAppCredentials(company);
    if (!app) return null;
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", app.clientId);
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
    const app = resolveGoogleAdsAppCredentials(await getCompanyById(companyId));
    if (!app) return { ok: false, message: GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE };

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code: authorizationCode,
            client_id: app.clientId,
            client_secret: app.clientSecret,
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
        { headers: { Authorization: `Bearer ${tokenData.access_token}`, "developer-token": app.developerToken } },
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

export interface GoogleAdsAccountOption {
    id: string;
    name: string;
}

export interface GoogleAdsAccountList {
    selectedId: string | null;
    accounts: GoogleAdsAccountOption[];
}

// Lists the client (non-manager) accounts under the company's own MCC, using the
// company's own OAuth refresh token, so each company can pick its own Google Ads account.
export async function listGoogleAdsAccounts(companyId: bigint): Promise<GoogleAdsAccountList> {
    const company = await getCompanyById(companyId);
    if (!company?.googleAdsRefreshToken) return { selectedId: null, accounts: [] };

    try {
        const app = resolveGoogleAdsAppCredentials(company);
        if (!app) return { selectedId: company.googleAdsCustomerId, accounts: [] };
        const manager = createGoogleAdsClient(app).Customer({
            customer_id: app.loginCustomerId,
            refresh_token: company.googleAdsRefreshToken,
            login_customer_id: app.loginCustomerId,
        });
        const rows = await manager.query(`
            SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager
            FROM customer_client
            WHERE customer_client.status = 'ENABLED'
        `);

        const accounts = rows
            .filter((row) => !row.customer_client?.manager)
            .map((row) => ({
                id: String(row.customer_client?.id),
                name: row.customer_client?.descriptive_name || String(row.customer_client?.id),
            }));
        return { selectedId: company.googleAdsCustomerId, accounts };
    } catch (err) {
        throw new Error(describeGoogleAdsError(err));
    }
}

export async function selectGoogleAdsAccount(companyId: bigint, customerId: string): Promise<void> {
    const { accounts } = await listGoogleAdsAccounts(companyId);
    if (!accounts.some((account) => account.id === customerId)) {
        throw new Error("Google Ads account is not available for this connection.");
    }
    await setGoogleAdsCustomerId(companyId, customerId);
}
