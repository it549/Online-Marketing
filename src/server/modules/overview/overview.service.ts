import { getFacebookApiPerformance } from "@/server/modules/facebook/facebookApiPerformance.service";
import { getShopeeApiPerformance, ShopeeCredentials } from "@/server/modules/shopee/shopeeApiPerformance.service";
import { getTikTokApiPerformance } from "@/server/modules/tiktok/tiktokApiPerformance.service";
import { getGoogleAdsApiPerformance } from "@/server/modules/google-ads/googleAdsApiPerformance.service";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { OverviewCampaignRow, OverviewPlatformSummary, OverviewResponse } from "@/types/overview";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

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

    const fbSpend = facebook.connected ? facebook.summary?.spend ?? 0 : 0;
    const fbLeads = facebook.connected ? facebook.summary?.leads ?? 0 : 0;
    const fbRoas = facebook.connected ? facebook.summary?.roas ?? null : null;

    const shopeeSpend = shopee?.connected ? shopee.summary?.spend ?? 0 : 0;
    const shopeeRevenue = shopee?.connected ? shopee.summary?.revenue ?? null : null;
    const shopeeRoas = shopee?.connected ? shopee.summary?.roas ?? null : null;

    const tiktokSpend = tiktok?.connected ? tiktok.summary?.spend ?? 0 : 0;
    const tiktokLeads = tiktok?.connected ? tiktok.summary?.leads ?? 0 : 0;

    const googleAdsSpend = googleAds?.connected ? googleAds.summary?.spend ?? 0 : 0;
    const googleAdsLeads = googleAds?.connected ? googleAds.summary?.leads ?? 0 : 0;

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
            hasData: facebook.connected,
            spend: fbSpend,
            revenue: null,
            roas: fbRoas,
            statusLabel: facebook.connected ? "เชื่อมต่อ API แล้ว" : "ยังไม่ได้เชื่อมต่อ API",
        },
        hasShopee
            ? {
                  id: "shopee",
                  name: "Shopee",
                  icon: "/icons/shopee.svg",
                  sourceType: "api",
                  hasData: shopee?.connected ?? false,
                  spend: shopeeSpend,
                  revenue: shopeeRevenue,
                  roas: shopeeRoas,
                  statusLabel: shopee?.connected ? "เชื่อมต่อ API แล้ว" : shopee?.error ?? "ยังไม่ได้เชื่อมต่อ API",
              }
            : null,
        hasTikTok
            ? {
                  id: "tiktok",
                  name: "TikTok",
                  icon: "/icons/tiktok.svg",
                  sourceType: "api",
                  hasData: tiktok?.connected ?? false,
                  spend: tiktokSpend,
                  revenue: null,
                  roas: null,
                  statusLabel: tiktok?.connected ? "เชื่อมต่อ API แล้ว" : tiktok?.error ?? "ยังไม่ได้เชื่อมต่อ API",
              }
            : null,
        hasGoogleAds
            ? {
                  id: "googleAds",
                  name: "Google Ads",
                  icon: "/icons/google-ads.svg",
                  sourceType: "api",
                  hasData: googleAds?.connected ?? false,
                  spend: googleAdsSpend,
                  revenue: null,
                  roas: null,
                  statusLabel: googleAds?.connected ? "เชื่อมต่อ API แล้ว" : googleAds?.error ?? "ยังไม่ได้เชื่อมต่อ API",
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
            shopeeRevenue: shopeeRevenue ?? 0,
            leads: totalLeads,
            avgRoas,
            avgCpl,
        },
        platforms: platformsResult,
        topCampaigns,
    };
}
