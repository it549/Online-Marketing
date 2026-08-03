import { config } from "@/server/configurations/config";
import { shopeeTimestamp, signShopeeRequest } from "./shopeeSign";

export class ShopeeApiError extends Error {}

interface ShopeeErrorBody {
    error?: string;
    message?: string;
}

export interface ShopeeTokenResult {
    shopId: string;
    accessToken: string;
    refreshToken: string;
    /** Absolute expiry instant for the access token (Shopee's `expire_in` is seconds-from-now). */
    expiresAt: Date;
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

    const body = await response.json();
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

    const body = await response.json();
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
