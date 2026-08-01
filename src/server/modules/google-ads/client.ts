import { GoogleAdsApi } from "google-ads-api";
import { config } from "@/server/configurations/config";

export const googleAdsClient = new GoogleAdsApi({
    client_id: config.google.clientID,
    client_secret: config.google.clientSecret,
    developer_token: config.google.develoerToken,
});