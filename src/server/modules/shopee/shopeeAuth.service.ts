import { config } from "@/server/configurations/config";
import { clearShopeeCredentials, getCompanyById, saveShopeeCredentials } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { shopeeTimestamp, signShopeeRequest } from "./shopeeSign";

export class ShopeeApiError extends Error {}

export interface ShopeeCredentials {
    companyId: bigint;
    shopId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date | null;
}

interface ShopeeErrorBody {
    error?: string;
    message?: string;
}

interface ShopeeTokenBody extends ShopeeErrorBody {
    shop_id?: number | string;
    access_token?: string;
    refresh_token?: string;
    expire_in?: number;
}

export interface ShopeeTokenResult {
    shopId: string;
    accessToken: string;
    refreshToken: string;
    /** Absolute expiry instant for the access token (Shopee's `expire_in` is seconds-from-now). */
    expiresAt: Date;
}

/** Shopee's gateway sometimes answers with a plain-text error (e.g. `ERROR_SP_...`) instead of JSON. */
export async function parseShopeeJson<T = ShopeeTokenBody>(response: Response): Promise<T> {
    const text = await response.text();
    try {
        return JSON.parse(text) as T;
    } catch {
        throw new ShopeeApiError(`Shopee ตอบกลับไม่ใช่ JSON (HTTP ${response.status}): ${text.slice(0, 200)}`);
    }
}

function assertNoShopeeError(body: ShopeeErrorBody, fallback: string): void {
    if (body.error) {
        throw new ShopeeApiError(body.message ? `${body.message} (${body.error})` : `${fallback}: ${body.error}`);
    }
}

/** Builds the Shopee "authorize this shop" URL the user's browser is redirected to. */
export function buildShopeeAuthUrl(): string {
    const path = "/api/v2/shop/auth_partner";
    const timestamp = shopeeTimestamp();
    const sign = signShopeeRequest(path, timestamp);

    const url = new URL(`${config.shopee.apiBaseUrl}${path}`);
    url.searchParams.set("partner_id", config.shopee.partnerID);
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("sign", sign);
    url.searchParams.set("redirect", config.shopee.redirectUrl);

    return url.toString();
}

export async function getShopeeAuthorizationUrlForCompany(companyId: bigint): Promise<string | null> {
    const company = await getCompanyById(companyId);
    if (!company || !parseCompanyPlatforms(company.platforms).includes("shopee")) return null;
    return buildShopeeAuthUrl();
}

export async function connectShopeeAccount(companyId: bigint, code: string, shopId: string): Promise<void> {
    await saveShopeeCredentials(companyId, await exchangeShopeeCode(code, shopId));
}

export function disconnectShopeeAccount(companyId: bigint): Promise<unknown> {
    return clearShopeeCredentials(companyId);
}

/** Exchanges the OAuth `code` Shopee redirected back with for an access/refresh token pair. */
export async function exchangeShopeeCode(code: string, shopId: string): Promise<ShopeeTokenResult> {
    const path = "/api/v2/auth/token/get";
    const timestamp = shopeeTimestamp();
    const sign = signShopeeRequest(path, timestamp);

    const url = new URL(`${config.shopee.apiBaseUrl}${path}`);
    url.searchParams.set("partner_id", config.shopee.partnerID);
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("sign", sign);

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, shop_id: Number(shopId), partner_id: Number(config.shopee.partnerID) }),
    });

    const body = await parseShopeeJson(response);
    assertNoShopeeError(body, "ไม่สามารถแลก token จาก Shopee ได้");

    if (!body.access_token || !body.refresh_token) {
        throw new ShopeeApiError("Shopee ไม่ได้ส่ง access_token/refresh_token กลับมา");
    }

    return {
        shopId: String(body.shop_id ?? shopId),
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: new Date(Date.now() + Number(body.expire_in ?? 0) * 1000),
    };
}

/**
 * Refreshes the access token if it's expired/near-expiry and persists the new pair
 * to the DB. Shared by the live-dashboard pull and the ETL sync so token-refresh
 * logic isn't duplicated between them.
 */
export async function ensureValidAccessToken(credentials: ShopeeCredentials): Promise<string> {
    const nearExpiry = !credentials.expiresAt || credentials.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (!nearExpiry) return credentials.accessToken;

    const refreshed = await refreshShopeeAccessToken(credentials.shopId, credentials.refreshToken);
    await saveShopeeCredentials(credentials.companyId, refreshed);
    return refreshed.accessToken;
}

/** Refreshes an expired/near-expiry access token using the stored refresh token. */
export async function refreshShopeeAccessToken(shopId: string, refreshToken: string): Promise<ShopeeTokenResult> {
    const path = "/api/v2/auth/access_token/get";
    const timestamp = shopeeTimestamp();
    const sign = signShopeeRequest(path, timestamp);

    const url = new URL(`${config.shopee.apiBaseUrl}${path}`);
    url.searchParams.set("partner_id", config.shopee.partnerID);
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("sign", sign);

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken, shop_id: Number(shopId), partner_id: Number(config.shopee.partnerID) }),
    });

    const body = await parseShopeeJson(response);
    assertNoShopeeError(body, "ไม่สามารถต่ออายุ token จาก Shopee ได้");

    if (!body.access_token || !body.refresh_token) {
        throw new ShopeeApiError("Shopee ไม่ได้ส่ง access_token/refresh_token กลับมา");
    }

    return {
        shopId: String(body.shop_id ?? shopId),
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: new Date(Date.now() + Number(body.expire_in ?? 0) * 1000),
    };
}
