import { getTikTokCampaignRepository } from "./tiktok.repository";
import { mapTikTokDashboard } from "./campaign.mapper";

export async function getTikTokDashboard() {
    const raw = await getTikTokCampaignRepository();

    return mapTikTokDashboard(raw);
}
