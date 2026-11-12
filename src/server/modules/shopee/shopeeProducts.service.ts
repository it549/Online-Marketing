import { ShopeeProduct, ShopeeProductsResponse } from "@/types/shopeeProducts";
import { ensureValidAccessToken, handleShopeeAuthFailure, type ShopeeCredentials } from "./shopeeAuth.service";
import { getShopeeCredentialsForCompany, shopeeShopGet } from "./shopeeApiPerformance.service";

// get_item_list pages up to 100 items; base/extra info take up to 50 item_id per call.
const ITEM_PAGE_SIZE = 100;
const ITEM_INFO_BATCH = 50;
// Deleted items are left out: they are not "the shop's products" any more.
const ITEM_STATUSES = ["NORMAL", "UNLIST", "BANNED"];

interface ShopeeItemBaseInfo {
    item_id: number;
    item_name?: string;
    item_sku?: string;
    item_status?: string;
    has_model?: boolean;
    image?: { image_url_list?: string[] };
    price_info?: { current_price?: number; original_price?: number }[];
    stock_info_v2?: { summary_info?: { total_available_stock?: number } };
}

interface ShopeeItemExtraInfo {
    item_id: number;
    sale?: number;
    views?: number;
    likes?: number;
    rating_star?: number;
}

// Product data changes slowly; one listing costs 1 + 2 calls per 50 products, so reuse it for a few minutes.
const PRODUCTS_CACHE_TTL_MS = 10 * 60 * 1000;
const productsCache = new Map<string, { at: number; value: ShopeeProductsResponse }>();

export async function getShopeeProductsForCompany(companyId: bigint, force = false): Promise<ShopeeProductsResponse> {
    const credentials = await getShopeeCredentialsForCompany(companyId);
    if (!credentials) {
        return {
            connected: false,
            lastSyncedAt: null,
            error: "ยังไม่ได้เชื่อมต่อ Shopee — ไปที่หน้า \"การเชื่อมต่อ\" แล้วกดปุ่มเชื่อมต่อ Shopee",
            products: [],
        };
    }

    const cacheKey = `${companyId}:${credentials.shopId}`;
    const cached = productsCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.at < PRODUCTS_CACHE_TTL_MS) return cached.value;

    try {
        const value: ShopeeProductsResponse = {
            connected: true,
            lastSyncedAt: new Date().toISOString(),
            products: await fetchShopeeProducts(credentials),
        };
        productsCache.set(cacheKey, { at: Date.now(), value });
        return value;
    } catch (error) {
        await handleShopeeAuthFailure(companyId, error);
        productsCache.delete(cacheKey);
        return {
            connected: false,
            lastSyncedAt: null,
            error: error instanceof Error ? error.message : "ดึงรายการสินค้าจาก Shopee ไม่สำเร็จ",
            products: [],
        };
    }
}

async function fetchShopeeProducts(credentials: ShopeeCredentials): Promise<ShopeeProduct[]> {
    const accessToken = await ensureValidAccessToken(credentials);
    const { shopId } = credentials;

    const itemIds: number[] = [];
    for (let offset = 0; ; ) {
        const page = await shopeeShopGet("/api/v2/product/get_item_list", shopId, accessToken, {
            offset: String(offset),
            page_size: String(ITEM_PAGE_SIZE),
            item_status: ITEM_STATUSES,
        });
        const body = page.response as { item?: { item_id: number }[]; has_next_page?: boolean; next_offset?: number } | undefined;
        itemIds.push(...(body?.item ?? []).map((item) => item.item_id));
        if (!body?.has_next_page || body.next_offset === undefined) break;
        offset = body.next_offset;
    }

    const products: ShopeeProduct[] = [];
    for (let i = 0; i < itemIds.length; i += ITEM_INFO_BATCH) {
        const idList = itemIds.slice(i, i + ITEM_INFO_BATCH).join(",");
        const [base, extra] = await Promise.all([
            shopeeShopGet("/api/v2/product/get_item_base_info", shopId, accessToken, { item_id_list: idList }),
            shopeeShopGet("/api/v2/product/get_item_extra_info", shopId, accessToken, { item_id_list: idList }),
        ]);
        const extraById = new Map(
            ((extra.response as { item_list?: ShopeeItemExtraInfo[] } | undefined)?.item_list ?? []).map((item) => [item.item_id, item]),
        );

        for (const item of (base.response as { item_list?: ShopeeItemBaseInfo[] } | undefined)?.item_list ?? []) {
            const stats = extraById.get(item.item_id);
            const price = item.price_info?.[0];
            products.push({
                id: String(item.item_id),
                name: item.item_name ?? `สินค้า #${item.item_id}`,
                sku: item.item_sku || null,
                status: item.item_status ?? "UNKNOWN",
                imageUrl: item.image?.image_url_list?.[0] ?? null,
                price: price?.current_price ?? null,
                originalPrice: price?.original_price ?? null,
                hasVariations: item.has_model ?? false,
                stock: item.stock_info_v2?.summary_info?.total_available_stock ?? null,
                sold: stats?.sale ?? null,
                views: stats?.views ?? null,
                likes: stats?.likes ?? null,
                rating: stats?.rating_star ?? null,
            });
        }
    }

    return products.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
}
