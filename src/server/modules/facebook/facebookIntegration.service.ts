import { config } from "@/server/configurations/config";
import { updateFacebookConnection, clearFacebookConnection } from "@/server/modules/company/company.repository";

const FACEBOOK_SCOPE = "ads_read";

export type FacebookConnectionResult =
    | { ok: true; accountName: string; accountCount: number }
    | { ok: false; message: string };

export function createFacebookAuthorizationUrl(state: string): string {
    const authUrl = new URL(`https://www.facebook.com/${config.facebook.apiVersion}/dialog/oauth`);
    authUrl.searchParams.set("client_id", config.facebook.appId);
    authUrl.searchParams.set("redirect_uri", config.facebook.redirectUrl);
    // Facebook Login for Business apps take permissions from a configuration, not `scope`.
    if (config.facebook.loginConfigId) {
        authUrl.searchParams.set("config_id", config.facebook.loginConfigId);
    } else {
        authUrl.searchParams.set("scope", FACEBOOK_SCOPE);
    }
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

    const selectedAccount = adAccounts[0];
    const expiresInSeconds = Number(longLivedData.expires_in ?? 60 * 60 * 24 * 60);
    await updateFacebookConnection(companyId, {
        adAccountId: selectedAccount.id,
        accessToken: longLivedData.access_token,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });

    return { ok: true, accountName: selectedAccount.name, accountCount: adAccounts.length };
}

export function disconnectFacebookAccount(companyId: bigint): Promise<void> {
    return clearFacebookConnection(companyId);
}
