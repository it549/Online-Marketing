import { getFacebookApiPerformance } from "@/server/modules/facebook/facebookApiPerformance.service";
import { getShopeeCampaignProfitRanking, ShopeeCampaignProfit } from "@/server/modules/ai-insights/shopeeTopCampaigns";
import { getTikTokApiPerformance } from "@/server/modules/tiktok/tiktokApiPerformance.service";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { CampaignRow, CampaignsResponse } from "@/types/campaigns";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

export async function getCampaigns(companyId: bigint): Promise<CampaignsResponse> {
    const company = await getCompanyById(companyId);
    const platforms = parseCompanyPlatforms(company?.platforms);
    const hasShopee = platforms.includes("shopee");
    const hasTikTok = platforms.includes("tiktok");

    const facebookCredentials =
        company?.facebookAdAccountId && company?.facebookAccessToken
            ? { adAccountId: company.facebookAdAccountId, accessToken: company.facebookAccessToken }
            : null;

    const tiktokCredentials =
        company?.tiktokAdvertiserId && company?.tiktokAccessToken
            ? { advertiserId: company.tiktokAdvertiserId, accessToken: company.tiktokAccessToken }
            : null;

    const [facebook, shopeeCampaigns, tiktok] = await Promise.all([
        getFacebookApiPerformance(facebookCredentials),
        hasShopee ? getShopeeCampaignProfitRanking(companyId) : Promise.resolve<ShopeeCampaignProfit[]>([]),
        hasTikTok ? getTikTokApiPerformance(tiktokCredentials) : Promise.resolve<ApiPerformanceResponse | null>(null),
    ]);

    const facebookRows: CampaignRow[] = (facebook.campaigns ?? []).map((campaign) => ({
        id: `facebook-${campaign.id}`,
        platform: "facebook",
        name: campaign.name,
        spend: campaign.spend,
        revenue: null,
        roas: null,
        secondaryLabel: "Leads",
        secondaryValue: campaign.leads.toLocaleString(),
        statusLabel: campaign.status === "ACTIVE" ? "กำลังทำงาน" : "หยุดชั่วคราว",
        statusTone: campaign.status === "ACTIVE" ? "positive" : "neutral",
    }));

    const shopeeRows: CampaignRow[] = shopeeCampaigns.map((campaign, index) => ({
        id: `shopee-${index}`,
        platform: "shopee",
        name: campaign.campaignName,
        spend: campaign.spend,
        revenue: campaign.revenue,
        roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : null,
        secondaryLabel: campaign.profit >= 0 ? "กำไร" : "ขาดทุน",
        secondaryValue: `฿${Math.abs(campaign.profit).toLocaleString()}`,
        statusLabel: campaign.profit >= 0 ? "ทำกำไร" : "ขาดทุน",
        statusTone: campaign.profit >= 0 ? "positive" : "negative",
    }));

    const tiktokRows: CampaignRow[] = (tiktok?.campaigns ?? []).map((campaign) => ({
        id: `tiktok-${campaign.id}`,
        platform: "tiktok",
        name: campaign.name,
        spend: campaign.spend,
        revenue: null,
        roas: null,
        secondaryLabel: "Leads",
        secondaryValue: campaign.leads.toLocaleString(),
        statusLabel: campaign.status === "ACTIVE" ? "กำลังทำงาน" : "หยุดชั่วคราว",
        statusTone: campaign.status === "ACTIVE" ? "positive" : "neutral",
    }));

    const campaigns = [...facebookRows, ...shopeeRows, ...tiktokRows].sort((a, b) => b.spend - a.spend);

    return {
        connected: {
            facebook: facebook.connected,
            shopee: shopeeCampaigns.length > 0,
            tiktok: tiktok?.connected ?? false,
        },
        campaigns,
    };
}
