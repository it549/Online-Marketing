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
// Longer history is fetched by walking back window-by-window (see getShopeeAdsSummary). Shopee rejects any
// date older than 6 months (ads.performance.error_date_too_old), so 7 windows (~196 days) always reach that limit.
const ADS_MAX_WINDOWS = 7;
// Days kept back from the exact 6-month mark so timezone/month-length differences never cross Shopee's limit.
const ADS_MAX_AGE_MARGIN_DAYS = 2;
const ADS_DATE_RANGE_LABEL = "ตั้งแต่เริ่มแคมเปญ (ย้อนหลังสูงสุด 6 เดือน)";

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
    common_info?: { campaign_duration?: { start_time?: number; end_time?: number } };
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
    const oldestAllowed = new Date(windowEnd);
    oldestAllowed.setUTCMonth(oldestAllowed.getUTCMonth() - 6);
    oldestAllowed.setUTCDate(oldestAllowed.getUTCDate() + ADS_MAX_AGE_MARGIN_DAYS);
    for (let i = 0; i < ADS_MAX_WINDOWS; i++) {
        if (windowEnd < oldestAllowed) break;
        const windowStart = new Date(Math.max(windowEnd.getTime() - ADS_LOOKBACK_DAYS * dayMs, oldestAllowed.getTime()));
        const dateParams = { start_date: formatShopeeAdsDate(windowStart), end_date: formatShopeeAdsDate(windowEnd) };

        const shopLevel = await shopeeShopGet("/api/v2/ads/get_all_cpc_ads_daily_performance", shopId, accessToken, dateParams);
        const dailyPoints = (shopLevel.response as unknown as ShopeeAdsDailyPoint[] | undefined) ?? [];
        const windowSpend = dailyPoints.reduce((sum, point) => sum + (point.expense ?? 0), 0);
        if (i > 0 && windowSpend === 0) break;

        totalSpend += windowSpend;
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
                });
            }
        }

        windowEnd = new Date(windowStart.getTime() - dayMs);
    }

    // Start/stop dates are cosmetic -- a failure here must not hide the performance numbers.
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
                const duration = setting.common_info?.campaign_duration;
                if (!campaign || !duration) continue;
                campaign.startDate = formatShopeeUnixDate(duration.start_time);
                campaign.endDate = formatShopeeUnixDate(duration.end_time);
            }
        } catch (error) {
            if (error instanceof ShopeeInvalidTokenError) throw error;
            console.warn("Shopee campaign setting info failed:", error);
        }
    }

    return { totalSpend, totalGmv, totalOrders, campaigns: [...campaignMap.values()] };
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

        const profitLoss = ads.totalGmv - ads.totalSpend;
        const roas = ads.totalSpend > 0 ? ads.totalGmv / ads.totalSpend : null;

        const metrics = [
            { id: "ads_spend", label: "ยอดใช้จ่ายโฆษณา", value: `฿${ads.totalSpend.toLocaleString()}`, subtitle: ADS_DATE_RANGE_LABEL, color: "text-blue-600" },
            { id: "ads_gmv", label: "ยอดขายจากโฆษณา (GMV)", value: `฿${ads.totalGmv.toLocaleString()}`, subtitle: ADS_DATE_RANGE_LABEL, color: "text-sky-600" },
            {
                id: "ads_profit_loss",
                label: profitLoss >= 0 ? "กำไรจากโฆษณา" : "ขาดทุนจากโฆษณา",
                value: `${profitLoss >= 0 ? "+" : ""}฿${profitLoss.toLocaleString()}`,
                subtitle: "GMV จากโฆษณา − ยอดใช้จ่ายโฆษณา (ยังไม่รวมต้นทุนสินค้า)",
                color: profitLoss >= 0 ? "text-emerald-600" : "text-rose-600",
            },
            { id: "ads_roas", label: "ROAS", value: roas !== null ? roas.toFixed(2) : "-", subtitle: "GMV / ยอดใช้จ่ายโฆษณา", color: "text-purple-600" },
        ];

        const sortedCampaigns = ads.campaigns.slice().sort((a, b) => b.spend - a.spend);

        return {
            connected: true,
            lastSyncedAt: new Date().toISOString(),
            dateRangeLabel: ADS_DATE_RANGE_LABEL,
            metrics,
            summary: { spend: ads.totalSpend, leads: ads.totalOrders, roas, revenue: ads.totalGmv },
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
                    { key: "gmv", label: "GMV", align: "right" },
                    { key: "profitLoss", label: "กำไร/ขาดทุน", align: "right" },
                    { key: "roas", label: "ROAS", align: "right" },
                    { key: "orders", label: "ออเดอร์", align: "right" },
                ],
                rows: sortedCampaigns.slice(0, 50).map((campaign) => ({
                    id: campaign.id,
                    name: campaign.name,
                    adType: campaign.adType,
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    spend: `฿${campaign.spend.toLocaleString()}`,
                    gmv: `฿${campaign.gmv.toLocaleString()}`,
                    profitLoss: `${campaign.profitLoss >= 0 ? "+" : ""}฿${campaign.profitLoss.toLocaleString()}`,
                    roas: campaign.roas !== null ? campaign.roas.toFixed(2) : "-",
                    orders: campaign.orders,
                })),
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
