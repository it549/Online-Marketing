import { Platform } from "@/types/platform";
import { getFacebookDashboard } from "../facebook/facebook.service";
import { getTikTokDashboard } from "../tiktok/tiktok.service";
import { mapDashboard } from "./dashboard.mapper";

export async function getDashboardService(platform: Platform) {
    let dashboard;

    switch (platform) {
        case "facebook":
            dashboard = await getFacebookDashboard();
            break;

        case "tiktok":
            dashboard = await getTikTokDashboard();
            break;

        default:
            throw new Error(`Platform ${platform} ยังไม่รองรับ`);
    }

    return mapDashboard(dashboard);
}
