import crypto from "crypto";
import { config } from "@/server/configurations/config";

/**
 * Shopee Open API v2 request signing (HMAC-SHA256).
 *
 * Public/auth endpoints (shop/auth_partner, auth/token/get, auth/access_token/get) sign
 * `partner_id + api_path + timestamp`. Shop-level endpoints (called after authorization)
 * additionally include the shop's access_token + shop_id in the base string -- pass
 * `shopContext` for those, omit it for the auth endpoints.
 */
export function signShopeeRequest(path: string, timestamp: number, shopContext?: { accessToken: string; shopId: string }): string {
    const base = shopContext
        ? `${config.shopee.partnerID}${path}${timestamp}${shopContext.accessToken}${shopContext.shopId}`
        : `${config.shopee.partnerID}${path}${timestamp}`;

    return crypto.createHmac("sha256", config.shopee.partnerKey).update(base).digest("hex");
}

export function shopeeTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}
