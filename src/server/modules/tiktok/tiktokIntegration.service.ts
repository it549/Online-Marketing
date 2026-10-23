import { config } from "@/server/configurations/config";
import { clearTikTokConnection, getCompanyById, updateTikTokConnection } from "@/server/modules/company/company.repository";

export const TIKTOK_API_BASE_URL = "https://business-api.tiktok.com/open_api/v1.3";

export type TikTokConnectionResult =
    | { ok: true; advertiserId: string; advertiserCount: number }
    | { ok: false; message: string };

/** Company's own App ID + Secret when both are set, otherwise the shared env ones. */
async function getTikTokAppConfig(companyId: bigint) {
    const company = await getCompanyById(companyId);
    const own = company?.tiktokAppId && company.tiktokAppSecret;
    const appId = own ? company.tiktokAppId : config.tiktok.appId;
    const appSecret = own ? company.tiktokAppSecret : config.tiktok.appSecret;
    const redirectUrl = config.tiktok.redirectUrl;
    if (!appId || !appSecret || !redirectUrl) {
        throw new Error("กรุณาตั้งค่า TikTok App ID / App Secret (และ TIKTOK_REDIRECT_URL) ก่อนเชื่อมต่อ");
    }
    return { appId, appSecret, redirectUrl };
}

export async function createTikTokAuthorizationUrl(companyId: bigint, state: string): Promise<string> {
    const { appId, redirectUrl } = await getTikTokAppConfig(companyId);
    const authUrl = new URL("https://business-api.tiktok.com/portal/auth");
    authUrl.searchParams.set("app_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUrl);
    authUrl.searchParams.set("state", state);
    return authUrl.toString();
}

export async function connectTikTokAccount(companyId: bigint, authCode: string): Promise<TikTokConnectionResult> {
    const { appId, appSecret } = await getTikTokAppConfig(companyId);

    const response = await fetch(`${TIKTOK_API_BASE_URL}/oauth2/access_token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, secret: appSecret, auth_code: authCode }),
    });
    const body = await response.json();
    const accessToken: string | undefined = body?.data?.access_token;
    if (!response.ok || body?.code !== 0 || !accessToken) {
        return { ok: false, message: body?.message ?? "Unable to exchange the TikTok authorization code." };
    }

    // v1.3 no longer returns advertiser_ids from the token exchange; fetch the authorized accounts separately.
    let advertiserIds: string[] = (body.data.advertiser_ids ?? []).map(String);
    if (!advertiserIds.length) {
        const listUrl = new URL(`${TIKTOK_API_BASE_URL}/oauth2/advertiser/get/`);
        listUrl.searchParams.set("app_id", appId);
        listUrl.searchParams.set("secret", appSecret);
        const listResponse = await fetch(listUrl.toString(), { headers: { "Access-Token": accessToken } });
        const listBody = await listResponse.json();
        if (!listResponse.ok || listBody?.code !== 0) {
            return { ok: false, message: listBody?.message ?? "Unable to list authorized TikTok Advertiser accounts." };
        }
        advertiserIds = ((listBody.data?.list ?? []) as { advertiser_id: string | number }[]).map((a) => String(a.advertiser_id));
    }
    if (!advertiserIds.length) {
        return { ok: false, message: "No accessible TikTok Advertiser account was found." };
    }

    await updateTikTokConnection(companyId, { advertiserId: advertiserIds[0], accessToken });
    return { ok: true, advertiserId: advertiserIds[0], advertiserCount: advertiserIds.length };
}

export function disconnectTikTokAccount(companyId: bigint): Promise<void> {
    return clearTikTokConnection(companyId);
}
