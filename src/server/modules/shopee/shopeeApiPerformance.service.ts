import { config } from "@/server/configurations/config";
import { ApiPerformanceResponse } from "@/types/apiPerformance";
import {
    ShopeeApiError,
    ShopeeInvalidTokenError,
    assertShopeeCallsAllowed,
    ensureValidAccessToken,
    handleShopeeAuthFailure,
    isShopeeInvalidTokenError,
    parseShopeeJson,
    type ShopeeCredentials,
} from "./shopeeAuth.service";
import { shopeeTimestamp, signShopeeRequest } from "./shopeeSign";
import { getCompanyById } from "@/server/modules/company/company.repository";

export type { ShopeeCredentials } from "./shopeeAuth.service";

export async function getShopeeApiPerformanceForCompany(companyId: bigint): Promise<ApiPerformanceResponse> {
    const company = await getCompanyById(companyId);
    const credentials: ShopeeCredentials | null =
        company?.shopeeShopId && company.shopeeAccessToken && company.shopeeRefreshToken
            ? {
                  companyId,
                  shopId: company.shopeeShopId,
                  accessToken: company.shopeeAccessToken,
                  refreshToken: company.shopeeRefreshToken,
                  expiresAt: company.shopeeTokenExpiresAt,
              }
            : null;
    return getShopeeApiPerformance(credentials);
}

// Shopee's ads performance APIs cap the range at 1 calendar month, counted inclusively
// (00:00:00 of start_date through 23:59:59 of end_date) -- a naive 30-day subtraction
// therefore spans 31 full days and gets rejected with "date range too long". 28 days
// keeps a safety margin regardless of which calendar month(s) the window falls in.
const ADS_LOOKBACK_DAYS = 28;
// Longer history is fetched by walking back window-by-window (see getShopeeAdsSummary), capped at ADS_MAX_MONTHS
// (Shopee itself rejects dates older than 6 months: ads.performance.error_date_too_old). 4 windows (~112 days) always reach 3 months.
const ADS_MAX_MONTHS = 3;
const ADS_MAX_WINDOWS = 4;
const ADS_DATE_RANGE_LABEL = `ตั้งแต่เริ่มแคมเปญ (ย้อนหลังสูงสุด ${ADS_MAX_MONTHS} เดือน)`;

// Shopee's Ads API only returns performance for product-level campaigns fetched in one call;
// shops running more than this many campaigns will only see the first page in the table below
// (the shop-wide totals metrics still cover every campaign via get_all_cpc_ads_daily_performance).
const MAX_CAMPAIGNS_PER_REQUEST = 100;

const AD_TYPE_LABEL_TH: Record<string, string> = {
    auto: "อัตโนมัติ",
    manual: "กำหนดเอง",
};

export interface ShopeeApiEnvelope {
    error?: string;
    message?: string;
    response?: Record<string, unknown>;
    warning?: string;
}

/** Shopee returns `response` as either a list of per-shop blocks or a single block object; always hand back a list. */
export function shopeeResponseList<T>(response: unknown): T[] {
    if (Array.isArray(response)) return response as T[];
    return response && typeof response === "object" ? [response as T] : [];
}

export async function shopeeShopGet(path: string, shopId: string, accessToken: string, params: Record<string, string> = {}): Promise<ShopeeApiEnvelope> {
    assertShopeeCallsAllowed();
    const timestamp = shopeeTimestamp();
    const sign = signShopeeRequest(path, timestamp, { accessToken, shopId });

    const url = new URL(`${config.shopee.apiBaseUrl}${path}`);
    url.searchParams.set("partner_id", config.shopee.partnerID);
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("sign", sign);
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("shop_id", shopId);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const response = await fetch(url.toString());
    const body = (await parseShopeeJson(response, path)) as ShopeeApiEnvelope;

    if (isShopeeInvalidTokenError(body)) {
        throw new ShopeeInvalidTokenError("Token Shopee ไม่ตรงกับแอปปัจจุบัน (เปลี่ยน partner_id/host หรือ token หมดอายุ) — ล้างการเชื่อมต่อเดิมแล้ว กรุณากดเชื่อมต่อ Shopee ใหม่");
    }
    if (body.error) {
        throw new ShopeeApiError(body.message ? `${body.message} (${body.error})` : `Shopee API error: ${body.error}`);
    }

    return body;
}

/** Shopee's ads APIs take dates as DD-MM-YYYY, unlike the order API's unix timestamps. */
function formatShopeeAdsDate(date: Date): string {
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

interface ShopeeCampaignSetting {
    campaign_id: number;
    // campaign_status: ongoing | scheduled | paused | ended | closed | deleted
    common_info?: { campaign_status?: string; campaign_duration?: { start_time?: number; end_time?: number }; item_id_list?: number[] };
}

/** Shopee uses unix seconds, with 0 / missing meaning "no date" (e.g. an open-ended campaign). */
function formatShopeeUnixDate(seconds?: number): string {
    if (!seconds) return "-";
    return new Date((seconds + 7 * 3600) * 1000).toISOString().slice(0, 10);
}

interface ShopeeAdsDailyPoint {
    expense: number;
    broad_gmv: number;
    broad_order: number;
}

interface ShopeeCampaignIdEntry {
    ad_type: string;
    campaign_id: number;
}

interface ShopeeCampaignMetricsPoint {
    expense: number;
    broad_gmv: number;
    broad_order: number;
}

interface ShopeeCampaignPerformance {
    campaign_id: number;
    ad_type: string;
    ad_name: string;
    metrics_list: ShopeeCampaignMetricsPoint[];
}

interface ShopeeAdsSummary {
    totalSpend: number;
    totalGmv: number;
    totalOrders: number;
    /** Start of the oldest ads window that was counted. */
    since: Date;
    campaigns: {
        id: string;
        name: string;
        adType: string;
        spend: number;
        gmv: number;
        orders: number;
        profitLoss: number;
        roas: number | null;
        startDate: string;
        endDate: string;
        /** Shopee campaign_status; null when the setting-info call failed. */
        status: string | null;
        /** Products this ad promotes (from setting info); empty when unknown. */
        itemIds: number[];
    }[];
}

/** Pulls shop-wide ad spend/GMV totals plus a per-campaign breakdown since the ads started (ADS_LOOKBACK_DAYS windows). */
async function getShopeeAdsSummary(shopId: string, accessToken: string): Promise<ShopeeAdsSummary> {
    const campaignIdList = await shopeeShopGet("/api/v2/ads/get_product_level_campaign_id_list", shopId, accessToken, {
        ad_type: "all",
        offset: "0",
        limit: String(MAX_CAMPAIGNS_PER_REQUEST),
    });
    const campaignEntries =
        ((campaignIdList.response as { campaign_list?: ShopeeCampaignIdEntry[] } | undefined)?.campaign_list) ?? [];

    const campaignIds = campaignEntries.map((entry) => entry.campaign_id).join(",");

    let totalSpend = 0;
    let totalGmv = 0;
    let totalOrders = 0;
    const campaignMap = new Map<number, ShopeeAdsSummary["campaigns"][number]>();

    // Walk backwards one window at a time until a window has no ad spend (campaigns started
    // after it) or the safety cap is hit -- every window is a separate API call.
    const dayMs = 24 * 60 * 60 * 1000;
    let windowEnd = new Date();
    let since = new Date(windowEnd);
    const oldestAllowed = new Date(windowEnd);
    oldestAllowed.setUTCMonth(oldestAllowed.getUTCMonth() - ADS_MAX_MONTHS);
    for (let i = 0; i < ADS_MAX_WINDOWS; i++) {
        if (windowEnd < oldestAllowed) break;
        const windowStart = new Date(Math.max(windowEnd.getTime() - ADS_LOOKBACK_DAYS * dayMs, oldestAllowed.getTime()));
        const dateParams = { start_date: formatShopeeAdsDate(windowStart), end_date: formatShopeeAdsDate(windowEnd) };

        const shopLevel = await shopeeShopGet("/api/v2/ads/get_all_cpc_ads_daily_performance", shopId, accessToken, dateParams);
        const dailyPoints = (shopLevel.response as unknown as ShopeeAdsDailyPoint[] | undefined) ?? [];
        const windowSpend = dailyPoints.reduce((sum, point) => sum + (point.expense ?? 0), 0);
        if (i > 0 && windowSpend === 0) break;

        totalSpend += windowSpend;
        since = windowStart;
        totalGmv += dailyPoints.reduce((sum, point) => sum + (point.broad_gmv ?? 0), 0);
        totalOrders += dailyPoints.reduce((sum, point) => sum + (point.broad_order ?? 0), 0);

        if (campaignEntries.length > 0) {
            const campaignPerformance = await shopeeShopGet("/api/v2/ads/get_product_campaign_daily_performance", shopId, accessToken, {
                ...dateParams,
                campaign_id_list: campaignIds,
            });
            const shopBlocks = shopeeResponseList<{ campaign_list?: ShopeeCampaignPerformance[] }>(campaignPerformance.response);

            for (const campaign of shopBlocks.flatMap((block) => block.campaign_list ?? [])) {
                const spend = campaign.metrics_list.reduce((sum, point) => sum + (point.expense ?? 0), 0);
                const gmv = campaign.metrics_list.reduce((sum, point) => sum + (point.broad_gmv ?? 0), 0);
                const orders = campaign.metrics_list.reduce((sum, point) => sum + (point.broad_order ?? 0), 0);
                const previous = campaignMap.get(campaign.campaign_id);
                const totalCampaignSpend = (previous?.spend ?? 0) + spend;
                const totalCampaignGmv = (previous?.gmv ?? 0) + gmv;

                campaignMap.set(campaign.campaign_id, {
                    id: String(campaign.campaign_id),
                    name: campaign.ad_name || `แคมเปญ #${campaign.campaign_id}`,
                    adType: AD_TYPE_LABEL_TH[campaign.ad_type] ?? campaign.ad_type,
                    spend: totalCampaignSpend,
                    gmv: totalCampaignGmv,
                    orders: (previous?.orders ?? 0) + orders,
                    profitLoss: totalCampaignGmv - totalCampaignSpend,
                    roas: totalCampaignSpend > 0 ? totalCampaignGmv / totalCampaignSpend : null,
                    startDate: "-",
                    endDate: "-",
                    status: null,
                    itemIds: previous?.itemIds ?? [],
                });
            }
        }

        windowEnd = new Date(windowStart.getTime() - dayMs);
    }

    // Start/stop dates and status come from here -- a failure must not hide the performance numbers.
    if (campaignEntries.length > 0) {
        try {
            const settings = await shopeeShopGet("/api/v2/ads/get_product_level_campaign_setting_info", shopId, accessToken, {
                info_type_list: "1",
                campaign_id_list: campaignIds,
            });
            const settingList =
                (settings.response as { campaign_list?: ShopeeCampaignSetting[] } | undefined)?.campaign_list ?? [];
            for (const setting of settingList) {
                const campaign = campaignMap.get(setting.campaign_id);
                if (!campaign) continue;
                campaign.status = setting.common_info?.campaign_status ?? null;
                campaign.itemIds = setting.common_info?.item_id_list ?? [];
                const duration = setting.common_info?.campaign_duration;
                if (!duration) continue;
                campaign.startDate = formatShopeeUnixDate(duration.start_time);
                campaign.endDate = formatShopeeUnixDate(duration.end_time);
            }
        } catch (error) {
            if (error instanceof ShopeeInvalidTokenError) throw error;
            console.warn("Shopee campaign setting info failed:", error);
        }
    }

    return { totalSpend, totalGmv, totalOrders, campaigns: [...campaignMap.values()], since };
}

// Shopee's order list caps time_from..time_to at 15 days; order detail takes up to 50 order_sn per call.
const ORDER_WINDOW_DAYS = 15;
const ORDER_PAGE_SIZE = 100;
const ORDER_DETAIL_BATCH = 50;

interface ShopeeOrderDetail {
    order_sn: string;
    order_status?: string;
    item_list?: { item_id?: number; model_discounted_price?: number; model_quantity_purchased?: number }[];
}

interface ShopeeCompletedSales {
    sales: number;
    orders: number;
    /** Completed sales per product: amount, and number of orders containing it. */
    byItem: Map<number, { sales: number; orders: number }>;
    orderSns: string[];
}

/**
 * Real sales only: shop-wide orders created in [since, now] whose status is COMPLETED (buyer received, not
 * cancelled/unpaid/returned). Amount is item price after discount x quantity, excluding shipping -- the same basis as ads GMV.
 */
async function getShopeeCompletedSales(shopId: string, accessToken: string, since: Date): Promise<ShopeeCompletedSales> {
    const orderSns: string[] = [];
    const nowSec = Math.floor(Date.now() / 1000);
    for (let from = Math.floor(since.getTime() / 1000); from < nowSec; from += ORDER_WINDOW_DAYS * 86400) {
        const to = Math.min(from + ORDER_WINDOW_DAYS * 86400 - 1, nowSec);
        let cursor = "";
        for (;;) {
            const page = await shopeeShopGet("/api/v2/order/get_order_list", shopId, accessToken, {
                time_range_field: "create_time",
                time_from: String(from),
                time_to: String(to),
                page_size: String(ORDER_PAGE_SIZE),
                cursor,
                order_status: "COMPLETED",
            });
            const body = page.response as { order_list?: { order_sn: string }[]; more?: boolean; next_cursor?: string } | undefined;
            orderSns.push(...(body?.order_list ?? []).map((order) => order.order_sn));
            if (!body?.more || !body.next_cursor) break;
            cursor = body.next_cursor;
        }
    }

    let sales = 0;
    let orders = 0;
    const byItem = new Map<number, { sales: number; orders: number }>();
    const completedSns: string[] = [];
    for (let i = 0; i < orderSns.length; i += ORDER_DETAIL_BATCH) {
        const detail = await shopeeShopGet("/api/v2/order/get_order_detail", shopId, accessToken, {
            order_sn_list: orderSns.slice(i, i + ORDER_DETAIL_BATCH).join(","),
            response_optional_fields: "item_list",
        });
        const list = (detail.response as { order_list?: ShopeeOrderDetail[] } | undefined)?.order_list ?? [];
        for (const order of list) {
            if (order.order_status !== "COMPLETED") continue;
            orders += 1;
            completedSns.push(order.order_sn);
            const counted = new Set<number>();
            for (const item of order.item_list ?? []) {
                const amount = (item.model_discounted_price ?? 0) * (item.model_quantity_purchased ?? 0);
                sales += amount;
                if (item.item_id === undefined) continue;
                const entry = byItem.get(item.item_id) ?? { sales: 0, orders: 0 };
                entry.sales += amount;
                // One order can hold several models of the same product -- count the order once.
                if (!counted.has(item.item_id)) entry.orders += 1;
                counted.add(item.item_id);
                byItem.set(item.item_id, entry);
            }
        }
    }
    return { sales, orders, byItem, orderSns: completedSns };
}

interface ShopeeOrderIncome {
    /** What Shopee releases to the seller after every fee, voucher and shipping adjustment. */
    escrow_amount?: number;
    commission_fee?: number;
    service_fee?: number;
    seller_transaction_fee?: number;
}

// A COMPLETED order's escrow no longer changes, so keep it for the process lifetime: each order costs one
// get_escrow_detail call (one order per call) only the first time it is seen.
const escrowCache = new Map<string, { payout: number; fees: number }>();
const ESCROW_CONCURRENCY = 10;

/** Money actually received for these orders (escrow), and Shopee's fees taken from them. */
async function getShopeePayout(
    shopId: string,
    accessToken: string,
    orderSns: string[],
): Promise<{ payout: number; fees: number; counted: number }> {
    const missing = orderSns.filter((sn) => !escrowCache.has(`${shopId}:${sn}`));
    for (let i = 0; i < missing.length; i += ESCROW_CONCURRENCY) {
        await Promise.all(
            missing.slice(i, i + ESCROW_CONCURRENCY).map(async (sn) => {
                const detail = await shopeeShopGet("/api/v2/payment/get_escrow_detail", shopId, accessToken, { order_sn: sn });
                const income = (detail.response as { order_income?: ShopeeOrderIncome } | undefined)?.order_income;
                if (!income) return; // not counted; retried next time
                escrowCache.set(`${shopId}:${sn}`, {
                    payout: income.escrow_amount ?? 0,
                    fees: (income.commission_fee ?? 0) + (income.service_fee ?? 0) + (income.seller_transaction_fee ?? 0),
                });
            }),
        );
    }

    let payout = 0;
    let fees = 0;
    let counted = 0;
    for (const sn of orderSns) {
        const entry = escrowCache.get(`${shopId}:${sn}`);
        if (!entry) continue;
        payout += entry.payout;
        fees += entry.fees;
        counted += 1;
    }
    return { payout, fees, counted };
}

// Overview and the Shopee page both load this on every visit; Shopee ads data only moves a few times a day,
// so reuse a recent successful result instead of spending 4 API calls per page view.
const PERFORMANCE_CACHE_TTL_MS = 10 * 60 * 1000;
const performanceCache = new Map<string, { at: number; value: ApiPerformanceResponse }>();
// Overview, the Shopee page and Integrations can load at the same moment; share one burst of Shopee calls instead of one each (error_rate_limit).
const performanceInFlight = new Map<string, Promise<ApiPerformanceResponse>>();

export async function getShopeeApiPerformance(credentials: ShopeeCredentials | null): Promise<ApiPerformanceResponse> {
    if (!credentials) return fetchShopeeApiPerformance(credentials);

    const cacheKey = `${credentials.companyId}:${credentials.shopId}`;
    const cached = performanceCache.get(cacheKey);
    if (cached && Date.now() - cached.at < PERFORMANCE_CACHE_TTL_MS) return cached.value;

    const pending = performanceInFlight.get(cacheKey);
    if (pending) return pending;

    const request = fetchShopeeApiPerformance(credentials)
        .then((value) => {
            if (value.connected) performanceCache.set(cacheKey, { at: Date.now(), value });
            else performanceCache.delete(cacheKey);
            return value;
        })
        .finally(() => performanceInFlight.delete(cacheKey));
    performanceInFlight.set(cacheKey, request);
    return request;
}

async function fetchShopeeApiPerformance(credentials: ShopeeCredentials | null): Promise<ApiPerformanceResponse> {
    if (!credentials) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: "ยังไม่ได้เชื่อมต่อ Shopee — ไปที่หน้า \"การเชื่อมต่อ\" แล้วกดปุ่มเชื่อมต่อ Shopee",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }

    try {
        const accessToken = await ensureValidAccessToken(credentials);

        // No separate get_shop_info probe: the ads calls below reject a bad token themselves, and every extra call counts toward Shopee's 90% success-rate rule.
        const ads = await getShopeeAdsSummary(credentials.shopId, accessToken);

        // Sales = completed orders only (ads GMV also counts cancelled/unpaid/not-yet-received orders).
        // An Order API failure (e.g. app lacks order permission) must not hide the ads numbers, and must not fall back to ads GMV.
        let completed: ShopeeCompletedSales | null = null;
        let completedError: string | null = null;
        try {
            completed = await getShopeeCompletedSales(credentials.shopId, accessToken, ads.since);
        } catch (error) {
            if (error instanceof ShopeeInvalidTokenError) throw error;
            console.warn("Shopee completed orders failed:", error);
            completedError = error instanceof Error ? error.message : "ดึงออเดอร์จาก Shopee ไม่สำเร็จ";
        }

        // Real profit = money Shopee actually pays out (after commission/service/transaction fees, vouchers, shipping) − ad spend.
        // A Payment API failure (e.g. no payment permission) falls back to sales − spend, labelled as such.
        let payout: { payout: number; fees: number; counted: number } | null = null;
        let payoutError: string | null = null;
        if (completed) {
            try {
                payout = await getShopeePayout(credentials.shopId, accessToken, completed.orderSns);
            } catch (error) {
                if (error instanceof ShopeeInvalidTokenError) throw error;
                console.warn("Shopee escrow detail failed:", error);
                payoutError = error instanceof Error ? error.message : "ดึงข้อมูลเงินที่ได้รับจาก Shopee ไม่สำเร็จ";
            }
        }
        const payoutComplete = payout !== null && completed !== null && payout.counted === completed.orders;

        // Only running ads count. If no status came back (setting-info call failed), use every campaign / the shop-wide total
        // rather than showing zero.
        const statusKnown = ads.campaigns.some((campaign) => campaign.status !== null);
        const sortedCampaigns = ads.campaigns
            .filter((campaign) => !statusKnown || campaign.status === "ongoing")
            // A product ad with no spend, GMV or orders in the range is noise.
            .filter((campaign) => campaign.spend !== 0 || campaign.gmv !== 0 || campaign.orders !== 0)
            .sort((a, b) => b.spend - a.spend);
        const spend = statusKnown ? sortedCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0) : ads.totalSpend;
        const spendSubtitle = statusKnown
            ? `เฉพาะ ${sortedCampaigns.length} โฆษณาที่เปิดอยู่ ${ADS_DATE_RANGE_LABEL}`
            : `ทุกโฆษณา (ดึงสถานะแคมเปญไม่สำเร็จ) ${ADS_DATE_RANGE_LABEL}`;

        // Per row: completed sales of the product(s) the ad promotes (all completed orders of that product, ads or not --
        // Shopee doesn't say which completed order came from an ad). null when the products or orders are unknown.
        const rowSales = (campaign: (typeof sortedCampaigns)[number]) => {
            if (!completed || campaign.itemIds.length === 0) return null;
            return campaign.itemIds.reduce(
                (total, itemId) => {
                    const item = completed.byItem.get(itemId);
                    return { sales: total.sales + (item?.sales ?? 0), orders: total.orders + (item?.orders ?? 0) };
                },
                { sales: 0, orders: 0 },
            );
        };

        const profitLoss = payoutComplete ? payout!.payout - spend : completed ? completed.sales - spend : null;
        const roas = completed && spend > 0 ? completed.sales / spend : null;

        const metrics = [
            { id: "ads_spend", label: "ยอดใช้จ่ายโฆษณา", value: `฿${spend.toLocaleString()}`, subtitle: spendSubtitle, color: "text-blue-600" },
            {
                id: "completed_sales",
                label: "ยอดขายจริง (ออเดอร์สำเร็จ)",
                value: completed ? `฿${completed.sales.toLocaleString()}` : "-",
                subtitle: completed
                    ? `${completed.orders.toLocaleString()} ออเดอร์ที่สำเร็จแล้ว (ไม่รวมยกเลิก/ยังไม่ได้รับสินค้า) ทั้งร้าน ${ADS_DATE_RANGE_LABEL}`
                    : `ดึงออเดอร์ไม่สำเร็จ: ${completedError}`,
                color: "text-sky-600",
            },
            {
                id: "shopee_payout",
                label: "เงินที่ได้รับจริง (หลังหักค่าธรรมเนียม)",
                value: payout ? `฿${payout.payout.toLocaleString()}` : "-",
                subtitle: payout
                    ? `ค่าธรรมเนียม/คอมมิชชั่น Shopee ฿${payout.fees.toLocaleString()}` +
                      (payoutComplete ? "" : ` · ได้ข้อมูล ${payout.counted.toLocaleString()}/${completed!.orders.toLocaleString()} ออเดอร์`)
                    : payoutError
                      ? `ดึงข้อมูลเงินที่ได้รับไม่สำเร็จ: ${payoutError}`
                      : "ต้องมีข้อมูลออเดอร์สำเร็จก่อน",
                color: "text-teal-600",
            },
            {
                id: "ads_profit_loss",
                label: (profitLoss === null || profitLoss >= 0 ? "กำไร" : "ขาดทุน") + (payoutComplete ? "จริง" : ""),
                value: profitLoss === null ? "-" : `${profitLoss >= 0 ? "+" : ""}฿${profitLoss.toLocaleString()}`,
                subtitle: payoutComplete
                    ? "เงินที่ได้รับจริง − ยอดใช้จ่ายโฆษณา (ยังไม่รวมต้นทุนสินค้า)"
                    : "ยอดขายจริง − ยอดใช้จ่ายโฆษณา (ยังไม่หักค่าธรรมเนียม Shopee และต้นทุนสินค้า)",
                color: profitLoss === null || profitLoss >= 0 ? "text-emerald-600" : "text-rose-600",
            },
            { id: "ads_roas", label: "ROAS", value: roas !== null ? roas.toFixed(2) : "-", subtitle: "ยอดขายจริง / ยอดใช้จ่ายโฆษณา", color: "text-purple-600" },
        ];

        return {
            connected: true,
            lastSyncedAt: new Date().toISOString(),
            dateRangeLabel: ADS_DATE_RANGE_LABEL,
            metrics,
            summary: { spend, leads: completed?.orders ?? 0, roas, revenue: completed?.sales },
            campaigns: sortedCampaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
                spend: campaign.spend,
                leads: campaign.orders,
                cpl: campaign.orders > 0 ? campaign.spend / campaign.orders : 0,
                status: campaign.adType,
            })),
            table: {
                columns: [
                    { key: "name", label: "แคมเปญ" },
                    { key: "adType", label: "ประเภท", align: "center" },
                    { key: "startDate", label: "เริ่ม", align: "center" },
                    { key: "endDate", label: "หยุด", align: "center" },
                    { key: "spend", label: "ยอดใช้จ่าย", align: "right" },
                    { key: "sales", label: "ยอดขายจริง (ออเดอร์สำเร็จ)", align: "right" },
                    { key: "profitLoss", label: "กำไร/ขาดทุน", align: "right" },
                    { key: "roas", label: "ROAS", align: "right" },
                    { key: "orders", label: "ออเดอร์สำเร็จ", align: "right" },
                ],
                rows: sortedCampaigns.slice(0, 50).map((campaign) => {
                    const real = rowSales(campaign);
                    const rowProfit = real ? real.sales - campaign.spend : null;
                    return {
                        id: campaign.id,
                        name: campaign.name,
                        adType: campaign.adType,
                        startDate: campaign.startDate,
                        endDate: campaign.endDate,
                        spend: `฿${campaign.spend.toLocaleString()}`,
                        sales: real ? `฿${real.sales.toLocaleString()}` : "-",
                        profitLoss: rowProfit === null ? "-" : `${rowProfit >= 0 ? "+" : ""}฿${rowProfit.toLocaleString()}`,
                        roas: real && campaign.spend > 0 ? (real.sales / campaign.spend).toFixed(2) : "-",
                        orders: real ? real.orders : "-",
                    };
                }),
            },
        };
    } catch (error) {
        await handleShopeeAuthFailure(credentials.companyId, error);
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อ Shopee API ได้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
}
