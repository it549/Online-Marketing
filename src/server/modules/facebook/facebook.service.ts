import { config } from "@/server/configurations/config";
import { GetCampaignsParams } from "@/server/types/meta/CampaignsParams";
import { FacebookCampaignResponse } from "@/types/facebook";
import { getFacebookCampaignRepository } from "./facebook.repository";
import { mapFacebookDashboard } from "./campaign.mapper";
import { MetaCampaignResponse } from "@/server/types/meta/MetaCampaignResponse";

export async function getFacebookDashboard() {
    const params: GetCampaignsParams = {
        baseUrl: config.facebook.baseUrl,
        apiVersion: config.facebook.apiVersion,
        accessToken: config.facebook.accessToken,
        adAccountId: config.facebook.adAccountId,
        datePreset: "last_30d",
    };

    const raw: MetaCampaignResponse = await getFacebookCampaignRepository(params);

    const campaigns = (raw.data ?? []).map((campaign) => {
        const insight = campaign.insights?.data?.[0];

        const spend = Number(insight?.spend ?? 0);

        const leads = Number(
            insight?.actions?.find(
                (a) => a.action_type === "lead",
            )?.value ?? 0,
        );

        const cpl = Number(
            insight?.cost_per_action_type?.find(
                (a) => a.action_type === "lead",
            )?.value ?? 0,
        );

        const ctr = Number(insight?.ctr ?? 0);

        return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            spend,
            leads,
            cpl,
            ctr,
        };
    });

    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);

    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);

    const avgCtr =
        campaigns.length > 0
            ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length
            : 0;

    const avgCpl =
        totalLeads > 0
            ? totalSpend / totalLeads
            : 0;

    const facebookData: FacebookCampaignResponse = {
        summary: {
            spend: totalSpend,
            leads: totalLeads,
            cpl: Number(avgCpl.toFixed(2)),
            ctr: Number(avgCtr.toFixed(2)),
        },
        campaigns,
    };

    return mapFacebookDashboard(facebookData);
}