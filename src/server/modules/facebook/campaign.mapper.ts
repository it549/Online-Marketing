import { DashboardData } from "@/types/dashboard";
import { FacebookCampaignResponse } from "@/types/facebook";

export function mapFacebookDashboard(raw: FacebookCampaignResponse): DashboardData {
    return {
        platform: "facebook",
        title: "Facebook Ads",
        metrics: [
            {
                id: "spend",
                label: "ยอดใช้จ่าย",
                value: `฿${raw.summary.spend.toLocaleString()}`,
                subtitle: "30 วันล่าสุด",
                color: "text-blue-400",
            },

            {
                id: "lead",
                label: "Leads",
                value: raw.summary.leads.toString(),
                subtitle: "30 วันล่าสุด",
                color: "text-green-400",
            },

            {
                id: "cpl",
                label: "Cost / Lead",
                value: `฿${raw.summary.cpl}`,
                subtitle: "Average",
                color: "text-yellow-400",
            },

            {
                id: "ctr",
                label: "CTR",
                value: `${raw.summary.ctr}%`,
                subtitle: "Click Through Rate",
                color: "text-purple-400",
            },
        ],

        table: {
            columns: [
                {
                    key: "name",
                    label: "Campaign",
                },

                {
                    key: "spend",
                    label: "Spend",
                    align: "right",
                },

                {
                    key: "leads",
                    label: "Leads",
                    align: "right",
                },

                {
                    key: "cpl",
                    label: "CPL",
                    align: "right",
                },

                {
                    key: "status",
                    label: "Status",
                    align: "center",
                },
            ],

            rows: raw.campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
                spend: `฿${campaign.spend.toLocaleString()}`,
                leads: campaign.leads,
                cpl: `฿${campaign.cpl}`,
                status: campaign.status,
            })),
        },
    };
}
