import { GetCampaignsParams } from "@/server/types/meta/CampaignsParams";
import { MetaCampaignResponse } from "@/server/types/meta/MetaCampaignResponse";

export async function getFacebookCampaignRepository(params: GetCampaignsParams): Promise<MetaCampaignResponse> {
    try {
        const url = new URL(`${params.baseUrl}/${params.apiVersion}/${params.adAccountId}/campaigns`);

        url.searchParams.set(
            "fields",
            `name,status,insights.date_preset(${params.datePreset}){spend,impressions,reach,clicks,ctr,actions,cost_per_action_type,action_values}`,
        );

        url.searchParams.set("access_token", params.accessToken);

        const response = await fetch(url.toString(), {
            cache: "no-store",
        });

        if (!response.ok) {
            const errorText = await response.text();

            console.error("Facebook API Error:", {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });

            throw new Error(extractGraphErrorMessage(errorText));
        }

        return await response.json() as MetaCampaignResponse;
    } catch (error) {
        console.error("Repository Error:", error);
        throw error;
    }
}

function extractGraphErrorMessage(errorText: string): string {
    try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string } };
        return parsed.error?.message ?? errorText;
    } catch {
        return errorText;
    }
}
