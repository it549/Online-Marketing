import { config } from "@/server/configurations/config";
import { clearShopeeCredentials, getCompanyById, saveShopeeCredentials } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { shopeeTimestamp, signShopeeRequest } from "./shopeeSign";

export class ShopeeApiError extends Error {}

/** The stored access token is no longer accepted by Shopee; only reconnecting the shop can fix it. */
export class ShopeeInvalidTokenError extends ShopeeApiError {}

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

export interface ShopeeTokenResult {
    shopId: string;
    accessToken: string;
    refreshToken: string;
    /** Absolute expiry instant for the access token (Shopee's `expire_in` is seconds-from-now). */
    expiresAt: Date;
}

// Shopee suspends developers whose 7-day API success rate drops under 90%, so once Shopee says the
// app is not allowed (bad IP / no permission) we stop calling for a while instead of failing on every page load.
// A stored token Shopee rejects (invalid_acceess_token is Shopee's own spelling) fails identically on every call until the shop is reconnected.
const SHOPEE_BLOCKING_ERRORS = new Set(["error_api_permission", "source_ip_undeclared", "invalid_acceess_token", "invalid_access_token"]);
const SHOPEE_BLOCK_COOLDOWN_MS = 60 * 60 * 1000;
let shopeeBlock: { until: number; message: string } | null = null;

function blockShopeeCalls(message: string): void {
    shopeeBlock = { until: Date.now() + SHOPEE_BLOCK_COOLDOWN_MS, message };
}

/** Throws without calling Shopee while a recent permission/IP rejection is still cooling down. */
export function assertShopeeCallsAllowed(): void {
    if (shopeeBlock && Date.now() < shopeeBlock.until) {
        throw new ShopeeApiError(`${shopeeBlock.message} — พักการเรียก Shopee ชั่วคราวเพื่อไม่ให้อัตราสำเร็จของ API ลดลง (ลองใหม่ภายใน 1 ชั่วโมง หรือกดเชื่อมต่อ Shopee ใหม่)`);
    }
    shopeeBlock = null;
}

/** Shopee sometimes answers with plain text (e.g. ERROR_SP_...) instead of JSON; surface it instead of a JSON parse crash. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseShopeeJson(response: Response, path: string): Promise<ShopeeErrorBody & Record<string, any>> {
    const text = await response.text();
    try {
        const body = JSON.parse(text);
        if (body?.error && SHOPEE_BLOCKING_ERRORS.has(body.error)) {
            blockShopeeCalls(body.message ? `${body.message} (${body.error})` : String(body.error));
        }
        return body;
    } catch {
        if (text.includes("ERROR_SP_SERVICE_NOT_FOUND")) {
            const message = `แอป Shopee นี้ไม่มีสิทธิ์ใช้ API นี้ (${path}) — ตรวจ App Category (ต้องเป็น Ads Service สำหรับ /ads) และว่าไม่ได้ใช้ host sandbox`;
            blockShopeeCalls(message);
            throw new ShopeeApiError(message);
        }
        throw new ShopeeApiError(`Shopee ตอบกลับไม่ใช่ JSON (HTTP ${response.status}, ${path}): ${text.slice(0, 200)}`);
    }
}

/** Token issued by a different Shopee app/environment than the one configured now is rejected with this. */
export function isShopeeInvalidTokenError(body: ShopeeErrorBody): boolean {
    return body.error === "invalid_acceess_token" || body.error === "invalid_access_token";
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

/**
 * A rejected stored token never recovers by itself, so drop it: the UI then shows "not connected"
 * with a reconnect button and nothing keeps calling Shopee with a dead token.
 */
export async function handleShopeeAuthFailure(companyId: bigint, error: unknown): Promise<void> {
    if (!(error instanceof ShopeeInvalidTokenError)) return;
    try {
        await clearShopeeCredentials(companyId);
    } catch {
        // Best effort: the call cooldown still prevents repeated failing requests.
    }
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

    const body = await parseShopeeJson(response, path);
    assertNoShopeeError(body, "ไม่สามารถแลก token จาก Shopee ได้");

    if (!body.access_token || !body.refresh_token) {
        throw new ShopeeApiError("Shopee ไม่ได้ส่ง access_token/refresh_token กลับมา");
    }

    // A fresh, successful authorization proves the app is allowed again.
    shopeeBlock = null;

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
    assertShopeeCallsAllowed();
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

    const body = await parseShopeeJson(response, path);
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
