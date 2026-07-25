import { getCampaignDashboardData } from "../campaign-dashboard/campaignDashboard.service";
import { mapCampaignDashboard } from "../campaign-dashboard/campaignDashboard.mapper";

export async function getShopeeDashboard() {
    const raw = await getCampaignDashboardData("SHOPEE");
    return mapCampaignDashboard(raw, { platform: "shopee", title: "Shopee Ads" });
}
