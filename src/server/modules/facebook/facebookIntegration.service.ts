import { config } from "@/server/configurations/config";
import {
    getCompanyById,
    updateFacebookConnection,
    clearFacebookConnection,
    updateFacebookAdAccountId,
} from "@/server/modules/company/company.repository";

const FACEBOOK_SCOPE = "ads_read";

export type FacebookConnectionResult =
    | { ok: true; accountName: string; accountCount: number }
    | { ok: false; message: string };

export function createFacebookAuthorizationUrl(state: string): string {
    const authUrl = new URL(`https://www.facebook.com/${config.facebook.apiVersion}/dialog/oauth`);
    authUrl.searchParams.set("client_id", config.facebook.appId);
    authUrl.searchParams.set("redirect_uri", config.facebook.redirectUrl);
    authUrl.searchParams.set("scope", FACEBOOK_SCOPE);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");
    return authUrl.toString();
}

export async function connectFacebookAccount(
    companyId: bigint,
    authorizationCode: string,
): Promise<FacebookConnectionResult> {
    const baseUrl = `${config.facebook.baseUrl}/${config.facebook.apiVersion}`;
    const shortLivedUrl = new URL(`${baseUrl}/oauth/access_token`);
    shortLivedUrl.searchParams.set("client_id", config.facebook.appId);
    shortLivedUrl.searchParams.set("client_secret", config.facebook.appSecret);
    shortLivedUrl.searchParams.set("redirect_uri", config.facebook.redirectUrl);
    shortLivedUrl.searchParams.set("code", authorizationCode);

    const shortLivedResponse = await fetch(shortLivedUrl.toString());
    const shortLivedData = await shortLivedResponse.json();
    if (!shortLivedResponse.ok || !shortLivedData.access_token) {
        return { ok: false, message: "Unable to exchange the Facebook authorization code." };
    }

    const longLivedUrl = new URL(`${baseUrl}/oauth/access_token`);
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", config.facebook.appId);
    longLivedUrl.searchParams.set("client_secret", config.facebook.appSecret);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedData.access_token);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedResponse.json();
    if (!longLivedResponse.ok || !longLivedData.access_token) {
        return { ok: false, message: "Unable to create a long-lived Facebook access token." };
    }

    const adAccountsUrl = new URL(`${baseUrl}/me/adaccounts`);
    adAccountsUrl.searchParams.set("fields", "id,name,account_id");
    adAccountsUrl.searchParams.set("access_token", longLivedData.access_token);
    const adAccountsResponse = await fetch(adAccountsUrl.toString());
    const adAccountsData = await adAccountsResponse.json();
    const adAccounts = adAccountsData.data as Array<{ id: string; name: string }> | undefined;
    if (!adAccountsResponse.ok || !adAccounts?.length) {
        return { ok: false, message: "No accessible Facebook Ad Account was found." };
    }

    const grantedAccountIds = await getGrantedAdAccountIds(baseUrl, longLivedData.access_token);
    const selectedAccount =
        adAccounts.find((account) => account.id === config.facebook.adAccountId) ??
        adAccounts.find((account) => grantedAccountIds.includes(String((account as { account_id?: string }).account_id))) ??
        adAccounts[0];
    const expiresInSeconds = Number(longLivedData.expires_in ?? 60 * 60 * 24 * 60);
    await updateFacebookConnection(companyId, {
        adAccountId: selectedAccount.id,
        accessToken: longLivedData.access_token,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });

    return { ok: true, accountName: selectedAccount.name, accountCount: adAccounts.length };
}

// Ad accounts the user picked in Meta's consent dialog (granular scope targets of ads_read/ads_management).
async function getGrantedAdAccountIds(baseUrl: string, userToken: string): Promise<string[]> {
    try {
        const debugUrl = new URL(`${baseUrl}/debug_token`);
        debugUrl.searchParams.set("input_token", userToken);
        debugUrl.searchParams.set("access_token", `${config.facebook.appId}|${config.facebook.appSecret}`);
        const response = await fetch(debugUrl.toString());
        const body = await response.json();
        const scopes = (body?.data?.granular_scopes ?? []) as Array<{ scope: string; target_ids?: string[] }>;
        return scopes
            .filter((entry) => entry.scope === "ads_read" || entry.scope === "ads_management")
            .flatMap((entry) => entry.target_ids ?? []);
    } catch {
        return [];
    }
}

export type FacebookAdAccountOption = { id: string; name: string };

async function fetchAdAccounts(accessToken: string): Promise<FacebookAdAccountOption[]> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/me/adaccounts`);
    url.searchParams.set("fields", "id,name,account_id");
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", accessToken);
    const response = await fetch(url.toString(), { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error?.message ?? "Unable to load Facebook ad accounts.");
    return ((body.data ?? []) as FacebookAdAccountOption[]).map(({ id, name }) => ({ id, name }));
}

export async function listFacebookAdAccounts(
    companyId: bigint,
): Promise<{ selectedId: string | null; accounts: FacebookAdAccountOption[] }> {
    const company = await getCompanyById(companyId);
    if (!company?.facebookAccessToken) return { selectedId: null, accounts: [] };
    return {
        selectedId: company.facebookAdAccountId,
        accounts: await fetchAdAccounts(company.facebookAccessToken),
    };
}

export async function selectFacebookAdAccount(companyId: bigint, adAccountId: string): Promise<boolean> {
    const { accounts } = await listFacebookAdAccounts(companyId);
    if (!accounts.some((account) => account.id === adAccountId)) return false;
    await updateFacebookAdAccountId(companyId, adAccountId);
    return true;
}

export function disconnectFacebookAccount(companyId: bigint): Promise<void> {
    return clearFacebookConnection(companyId);
}
