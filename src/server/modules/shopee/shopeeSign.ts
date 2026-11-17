import crypto from "crypto";
import { config } from "@/server/configurations/config";

/**
 * "ads" = the optional second Shopee app (App Category "Ads Service", SHOPEE_ADS_PARTNER_ID/KEY);
 * "main" = the primary app (e.g. ERP System) for order/product/payment. Without an ads app configured,
 * everything goes through "main".
 */
export type ShopeeApp = "main" | "ads";

export function hasSeparateShopeeAdsApp(): boolean {
    return config.shopee.ads !== null;
}

export function shopeePartner(app: ShopeeApp): { partnerID: string; partnerKey: string } {
    return app === "ads" && config.shopee.ads ? config.shopee.ads : config.shopee;
}

/** /api/v2/ads/... goes through the Ads Service app when one is configured; every other module through the main app. */
export function shopeeAppForPath(path: string): ShopeeApp {
    return hasSeparateShopeeAdsApp() && path.startsWith("/api/v2/ads/") ? "ads" : "main";
}

/**
 * Shopee Open API v2 request signing (HMAC-SHA256).
 *
 * Public/auth endpoints (shop/auth_partner, auth/token/get, auth/access_token/get) sign
 * `partner_id + api_path + timestamp`. Shop-level endpoints (called after authorization)
 * additionally include the shop's access_token + shop_id in the base string -- pass
 * `shopContext` for those, omit it for the auth endpoints.
 */
export function signShopeeRequest(
    path: string,
    timestamp: number,
    shopContext?: { accessToken: string; shopId: string },
    app: ShopeeApp = "main",
): string {
    const { partnerID, partnerKey } = shopeePartner(app);
    const base = shopContext
        ? `${partnerID}${path}${timestamp}${shopContext.accessToken}${shopContext.shopId}`
        : `${partnerID}${path}${timestamp}`;

    return crypto.createHmac("sha256", partnerKey).update(base).digest("hex");
}

export function shopeeTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}
