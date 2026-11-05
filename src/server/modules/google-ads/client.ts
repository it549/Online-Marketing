import { GoogleAdsApi } from "google-ads-api";
import type { GoogleAdsAppCredentials } from "@/types/googleAds";

export function createGoogleAdsClient(app: GoogleAdsAppCredentials) {
    return new GoogleAdsApi({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        developer_token: app.developerToken,
    });
}
