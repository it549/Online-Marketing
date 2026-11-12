import { getFacebookApiPerformance } from "@/server/modules/facebook/facebookApiPerformance.service";
import { getShopeeApiPerformance, ShopeeCredentials } from "@/server/modules/shopee/shopeeApiPerformance.service";
import { getTikTokApiPerformance } from "@/server/modules/tiktok/tiktokApiPerformance.service";
import { getGoogleAdsApiPerformance } from "@/server/modules/google-ads/googleAdsApiPerformance.service";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { getSpendTrend, getLeadsSummaryOnly } from "@/server/modules/insights/insights.service";
import { OverviewCampaignRow, OverviewInsightResponse, OverviewPlatformSummary, OverviewResponse } from "@/types/overview";
import { ApiPerformanceResponse } from "@/types/apiPerformance";
import type { SpendTrendPoint } from "@/types/insights";
import type { CompanyPlatformId } from "@/types/company";

const SYNCED_LABEL = "ข้อมูลที่ซิงค์ไว้ (30 วันล่าสุด)";

async function getSyncedPlatformTotals(companyId: bigint, platform: CompanyPlatformId, dateFrom: Date, dateTo: Date) {
    const trend = await getSpendTrend(companyId, platform, dateFrom, dateTo);
    const spend = trend.points.reduce((sum, p) => sum + p.spend, 0);
    const conversions = trend.points.reduce((sum, p) => sum + p.conversions, 0);
    const conversionsValue = trend.points.reduce((sum, p) => sum + p.conversionsValue, 0);
    return {
        hasData: trend.hasDataInRange,
        spend,
        conversions,
        conversionsValue,
        roas: spend > 0 && conversionsValue > 0 ? conversionsValue / spend : null,
    };
}

async function getSyncedTotals(companyId: bigint, dateFrom: Date, dateTo: Date) {
    const [facebook, shopee, tiktok, googleAds] = await Promise.all(
        (["facebook", "shopee", "tiktok", "googleAds"] as const).map((platform) => getSyncedPlatformTotals(companyId, platform, dateFrom, dateTo)),
    );
    return { facebook, shopee, tiktok, googleAds };
}

export async function getOverview(companyId: bigint): Promise<OverviewResponse> {
    const company = await getCompanyById(companyId);
    const platforms = parseCompanyPlatforms(company?.platforms);

    const hasShopee = platforms.includes("shopee");
    const hasTikTok = platforms.includes("tiktok");
    const hasGoogleAds = platforms.includes("googleAds");

    const facebookCredentials =
        company?.facebookAdAccountId && company?.facebookAccessToken
            ? { adAccountId: company.facebookAdAccountId, accessToken: company.facebookAccessToken }
            : null;

    const shopeeCredentials: ShopeeCredentials | null =
        company?.shopeeShopId && company?.shopeeAccessToken && company?.shopeeRefreshToken
            ? {
                  companyId,
                  shopId: company.shopeeShopId,
                  accessToken: company.shopeeAccessToken,
                  refreshToken: company.shopeeRefreshToken,
                  expiresAt: company.shopeeTokenExpiresAt,
              }
            : null;

    const tiktokCredentials =
        company?.tiktokAdvertiserId && company?.tiktokAccessToken
            ? { advertiserId: company.tiktokAdvertiserId, accessToken: company.tiktokAccessToken }
            : null;

    const googleAdsCredentials =
        company?.googleAdsCustomerId && company?.googleAdsRefreshToken
            ? { customerId: company.googleAdsCustomerId, refreshToken: company.googleAdsRefreshToken }
            : null;

    const [facebook, shopee, tiktok, googleAds] = await Promise.all([
        getFacebookApiPerformance(facebookCredentials),
        hasShopee ? getShopeeApiPerformance(shopeeCredentials) : Promise.resolve<ApiPerformanceResponse | null>(null),
        hasTikTok ? getTikTokApiPerformance(tiktokCredentials) : Promise.resolve<ApiPerformanceResponse | null>(null),
        hasGoogleAds ? getGoogleAdsApiPerformance(googleAdsCredentials) : Promise.resolve<ApiPerformanceResponse | null>(null),
    ]);

    // Live APIs can be unconnected/rejected while ETL has already synced data -- fall back to ad_insights (last 30d).
    const syncedTo = new Date(new Date().toISOString().slice(0, 10));
    const syncedFrom = new Date(syncedTo.getTime() - 29 * 24 * 60 * 60 * 1000);
    const synced = await getSyncedTotals(companyId, syncedFrom, syncedTo);

    const fbLive = facebook.connected;
    const fbSpend = fbLive ? facebook.summary?.spend ?? 0 : synced.facebook.spend;
    const fbLeads = fbLive ? facebook.summary?.leads ?? 0 : synced.facebook.conversions;
    const fbRoas = fbLive ? facebook.summary?.roas ?? null : synced.facebook.roas;

    const shopeeLive = shopee?.connected ?? false;
    const shopeeSpend = shopeeLive ? shopee?.summary?.spend ?? 0 : synced.shopee.spend;
    // Shopee sales = completed orders only, which only the live call has. Synced ad_insights hold ads GMV (includes
    // cancelled/unpaid orders), so no fallback for revenue/ROAS -- show "-" instead of an inflated number.
    const shopeeRevenue = shopeeLive ? shopee?.summary?.revenue ?? null : null;
    const shopeeRoas = shopeeLive ? shopee?.summary?.roas ?? null : null;

    const tiktokLive = tiktok?.connected ?? false;
    const tiktokSpend = tiktokLive ? tiktok?.summary?.spend ?? 0 : synced.tiktok.spend;
    const tiktokLeads = tiktokLive ? tiktok?.summary?.leads ?? 0 : synced.tiktok.conversions;

    const googleAdsLive = googleAds?.connected ?? false;
    const googleAdsSpend = googleAdsLive ? googleAds?.summary?.spend ?? 0 : synced.googleAds.spend;
    const googleAdsLeads = googleAdsLive ? googleAds?.summary?.leads ?? 0 : synced.googleAds.conversions;

    const totalSpend = fbSpend + shopeeSpend + tiktokSpend + googleAdsSpend;
    const totalLeads = fbLeads + tiktokLeads + googleAdsLeads;

    // ROAS is only meaningful where a platform reports both spend and a real ROAS figure.
    const roasEntries = [
        fbRoas !== null && fbSpend > 0 ? { roas: fbRoas, spend: fbSpend } : null,
        shopeeRoas !== null && shopeeSpend > 0 ? { roas: shopeeRoas, spend: shopeeSpend } : null,
    ].filter((entry): entry is { roas: number; spend: number } => entry !== null);

    const roasSpendSum = roasEntries.reduce((sum, entry) => sum + entry.spend, 0);
    const avgRoas = roasSpendSum > 0 ? roasEntries.reduce((sum, entry) => sum + entry.roas * entry.spend, 0) / roasSpendSum : null;

    // CPL only applies to lead-gen platforms (Facebook + TikTok + Google Ads) -- Shopee tracks orders, not leads.
    const leadGenSpend = fbSpend + tiktokSpend + googleAdsSpend;
    const avgCpl = totalLeads > 0 ? leadGenSpend / totalLeads : null;

    const platformRows: (OverviewPlatformSummary | null)[] = [
        {
            id: "facebook",
            name: "Facebook",
            icon: "/icons/facebook.svg",
            sourceType: "api",
            hasData: fbLive || synced.facebook.hasData,
            spend: fbSpend,
            revenue: null,
            roas: fbRoas,
            statusLabel: fbLive ? "เชื่อมต่อ API แล้ว" : synced.facebook.hasData ? SYNCED_LABEL : "ยังไม่ได้เชื่อมต่อ API",
        },
        hasShopee
            ? {
                  id: "shopee",
                  name: "Shopee",
                  icon: "/icons/shopee.svg",
                  sourceType: "api",
                  hasData: shopeeLive || synced.shopee.hasData,
                  spend: shopeeSpend,
                  revenue: shopeeRevenue,
                  roas: shopeeRoas,
                  statusLabel: shopeeLive ? "เชื่อมต่อ API แล้ว" : synced.shopee.hasData ? SYNCED_LABEL : shopee?.error ?? "ยังไม่ได้เชื่อมต่อ API",
              }
            : null,
        hasTikTok
            ? {
                  id: "tiktok",
                  name: "TikTok",
                  icon: "/icons/tiktok.svg",
                  sourceType: "api",
                  hasData: tiktokLive || synced.tiktok.hasData,
                  spend: tiktokSpend,
                  revenue: null,
                  roas: null,
                  statusLabel: tiktokLive ? "เชื่อมต่อ API แล้ว" : synced.tiktok.hasData ? SYNCED_LABEL : tiktok?.error ?? "ยังไม่ได้เชื่อมต่อ API",
              }
            : null,
        hasGoogleAds
            ? {
                  id: "googleAds",
                  name: "Google Ads",
                  icon: "/icons/google-ads.svg",
                  sourceType: "api",
                  hasData: googleAdsLive || synced.googleAds.hasData,
                  spend: googleAdsSpend,
                  revenue: null,
                  roas: null,
                  statusLabel: googleAdsLive ? "เชื่อมต่อ API แล้ว" : synced.googleAds.hasData ? SYNCED_LABEL : googleAds?.error ?? "ยังไม่ได้เชื่อมต่อ API",
              }
            : null,
    ];

    const platformsResult = platformRows.filter((p): p is OverviewPlatformSummary => p !== null);

    const topCampaigns: OverviewCampaignRow[] = [
        ...(facebook.campaigns ?? []).map((campaign) => ({ ...campaign, platform: "facebook" as const })),
        ...(tiktok?.campaigns ?? []).map((campaign) => ({ ...campaign, platform: "tiktok" as const })),
    ]
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 8);

    return {
        generatedAt: new Date().toISOString(),
        totals: {
            spend: totalSpend,
            shopeeRevenue,
            leads: totalLeads,
            avgRoas,
            avgCpl,
        },
        platforms: platformsResult,
        topCampaigns,
    };
}

/**
 * Combines the per-platform daily ETL trend (already used by the Insights page) across every
 * connected platform into one series, plus a cross-platform leads summary -- the real, date-ranged
 * data the homepage "AI Command Center" needs to compute genuine period-over-period deltas
 * (via summarizeTrend) instead of a live, non-date-ranged snapshot like getOverview() returns.
 */
export async function getOverviewInsight(companyId: bigint, dateFrom: Date, dateTo: Date): Promise<OverviewInsightResponse> {
    const company = await getCompanyById(companyId);
    const platforms = parseCompanyPlatforms(company?.platforms);

    const [trends, leadsSummary] = await Promise.all([
        Promise.all(platforms.map((platform) => getSpendTrend(companyId, platform, dateFrom, dateTo))),
        getLeadsSummaryOnly(companyId, undefined, dateFrom, dateTo),
    ]);

    const byDate = new Map<string, SpendTrendPoint>();
    for (const trend of trends) {
        for (const point of trend.points) {
            const existing = byDate.get(point.date);
            if (existing) {
                existing.impressions += point.impressions;
                existing.clicks += point.clicks;
                existing.spend += point.spend;
                existing.conversions += point.conversions;
                existing.conversionsValue += point.conversionsValue;
            } else {
                byDate.set(point.date, { ...point });
            }
        }
    }

    const points = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    const lastSyncedTimes = trends.map((t) => t.lastSyncedAt).filter((v): v is string => v !== null);

    return {
        hasSyncedBefore: trends.some((t) => t.hasSyncedBefore),
        hasDataInRange: points.length > 0,
        points,
        leadsSummary: leadsSummary.summary,
        lastSyncedAt: lastSyncedTimes.length > 0 ? lastSyncedTimes.sort().at(-1)! : null,
    };
}
