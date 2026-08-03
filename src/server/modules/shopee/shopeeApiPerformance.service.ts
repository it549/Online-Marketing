import { config } from "@/server/configurations/config";
import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { saveShopeeCredentials } from "@/server/modules/company/company.repository";
import { ShopeeApiError, refreshShopeeAccessToken } from "./shopeeAuth.service";
import { shopeeTimestamp, signShopeeRequest } from "./shopeeSign";

// Shopee's ads performance APIs cap the range at 1 calendar month, counted inclusively
// (00:00:00 of start_date through 23:59:59 of end_date) -- a naive 30-day subtraction
// therefore spans 31 full days and gets rejected with "date range too long". 28 days
// keeps a safety margin regardless of which calendar month(s) the window falls in.
const ADS_LOOKBACK_DAYS = 28;
const ADS_DATE_RANGE_LABEL = `${ADS_LOOKBACK_DAYS} วันล่าสุด`;

// Shopee's Ads API only returns performance for product-level campaigns fetched in one call;
// shops running more than this many campaigns will only see the first page in the table below
// (the shop-wide totals metrics still cover every campaign via get_all_cpc_ads_daily_performance).
const MAX_CAMPAIGNS_PER_REQUEST = 100;

const AD_TYPE_LABEL_TH: Record<string, string> = {
    auto: "อัตโนมัติ",
    manual: "กำหนดเอง",
};

export interface ShopeeCredentials {
    companyId: bigint;
    shopId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date | null;
}

interface ShopeeApiEnvelope {
    error?: string;
    message?: string;
    response?: Record<string, unknown>;
    warning?: string;
}

async function shopeeShopGet(path: string, shopId: string, accessToken: string, params: Record<string, string> = {}): Promise<ShopeeApiEnvelope> {
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
    const body = (await response.json()) as ShopeeApiEnvelope;

    if (body.error) {
        throw new ShopeeApiError(body.message ? `${body.message} (${body.error})` : `Shopee API error: ${body.error}`);
    }

    return body;
}

/** Refreshes the access token if it's expired/near-expiry and persists the new pair to the DB. */
async function ensureValidAccessToken(credentials: ShopeeCredentials): Promise<string> {
    const nearExpiry = !credentials.expiresAt || credentials.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (!nearExpiry) return credentials.accessToken;

    const refreshed = await refreshShopeeAccessToken(credentials.shopId, credentials.refreshToken);
    await saveShopeeCredentials(credentials.companyId, refreshed);
    return refreshed.accessToken;
}

/** Shopee's ads APIs take dates as DD-MM-YYYY, unlike the order API's unix timestamps. */
function formatShopeeAdsDate(date: Date): string {
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${date.getUTCFullYear()}`;
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
    }[];
}

/** Pulls shop-wide ad spend/GMV totals plus a per-campaign breakdown for the last ADS_LOOKBACK_DAYS days. */
async function getShopeeAdsSummary(shopId: string, accessToken: string): Promise<ShopeeAdsSummary> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - ADS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const dateParams = { start_date: formatShopeeAdsDate(startDate), end_date: formatShopeeAdsDate(endDate) };

    const shopLevel = await shopeeShopGet("/api/v2/ads/get_all_cpc_ads_daily_performance", shopId, accessToken, dateParams);
    const dailyPoints = (shopLevel.response as unknown as ShopeeAdsDailyPoint[] | undefined) ?? [];

    const totalSpend = dailyPoints.reduce((sum, point) => sum + (point.expense ?? 0), 0);
    const totalGmv = dailyPoints.reduce((sum, point) => sum + (point.broad_gmv ?? 0), 0);
    const totalOrders = dailyPoints.reduce((sum, point) => sum + (point.broad_order ?? 0), 0);

    const campaignIdList = await shopeeShopGet("/api/v2/ads/get_product_level_campaign_id_list", shopId, accessToken, {
        ad_type: "all",
        offset: "0",
        limit: String(MAX_CAMPAIGNS_PER_REQUEST),
    });
    const campaignEntries =
        ((campaignIdList.response as { campaign_list?: ShopeeCampaignIdEntry[] } | undefined)?.campaign_list) ?? [];

    if (campaignEntries.length === 0) {
        return { totalSpend, totalGmv, totalOrders, campaigns: [] };
    }

    const campaignPerformance = await shopeeShopGet("/api/v2/ads/get_product_campaign_daily_performance", shopId, accessToken, {
        ...dateParams,
        campaign_id_list: campaignEntries.map((entry) => entry.campaign_id).join(","),
    });

    const shopBlocks =
        (campaignPerformance.response as unknown as { campaign_list?: ShopeeCampaignPerformance[] }[] | undefined) ?? [];
    const campaignList = shopBlocks.flatMap((block) => block.campaign_list ?? []);

    const campaigns = campaignList.map((campaign) => {
        const spend = campaign.metrics_list.reduce((sum, point) => sum + (point.expense ?? 0), 0);
        const gmv = campaign.metrics_list.reduce((sum, point) => sum + (point.broad_gmv ?? 0), 0);
        const orders = campaign.metrics_list.reduce((sum, point) => sum + (point.broad_order ?? 0), 0);

        return {
            id: String(campaign.campaign_id),
            name: campaign.ad_name || `แคมเปญ #${campaign.campaign_id}`,
            adType: AD_TYPE_LABEL_TH[campaign.ad_type] ?? campaign.ad_type,
            spend,
            gmv,
            orders,
            profitLoss: gmv - spend,
            roas: spend > 0 ? gmv / spend : null,
        };
    });

    return { totalSpend, totalGmv, totalOrders, campaigns };
}

export async function getShopeeApiPerformance(credentials: ShopeeCredentials | null): Promise<ApiPerformanceResponse> {
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

        // Confirms the token is genuinely usable against this shop before pulling anything else.
        await shopeeShopGet("/api/v2/shop/get_shop_info", credentials.shopId, accessToken);

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
                    spend: `฿${campaign.spend.toLocaleString()}`,
                    gmv: `฿${campaign.gmv.toLocaleString()}`,
                    profitLoss: `${campaign.profitLoss >= 0 ? "+" : ""}฿${campaign.profitLoss.toLocaleString()}`,
                    roas: campaign.roas !== null ? campaign.roas.toFixed(2) : "-",
                    orders: campaign.orders,
                })),
            },
        };
    } catch (error) {
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
