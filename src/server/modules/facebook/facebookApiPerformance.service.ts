import { config } from "@/server/configurations/config";
import { GetCampaignsParams } from "@/server/types/meta/CampaignsParams";
import { MetaCampaignResponse } from "@/server/types/meta/MetaCampaignResponse";
import { getFacebookCampaignRepository } from "./facebook.repository";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

const DATE_PRESET_LABEL = "30 วันล่าสุด";

export async function getFacebookApiPerformance(): Promise<ApiPerformanceResponse> {
    try {
        const params: GetCampaignsParams = {
            baseUrl: config.facebook.baseUrl,
            apiVersion: config.facebook.apiVersion,
            accessToken: config.facebook.accessToken,
            adAccountId: config.facebook.adAccountId,
            datePreset: "last_30d",
        };

        const raw: MetaCampaignResponse = await getFacebookCampaignRepository(params);

        if (raw.error) {
            throw new Error(raw.error.message ?? "Facebook API Error");
        }

        const campaigns = (raw.data ?? []).map((campaign) => {
            const insight = campaign.insights?.data?.[0];

            const spend = Number(insight?.spend ?? 0);
            const impressions = Number(insight?.impressions ?? 0);
            const reach = Number(insight?.reach ?? 0);
            const clicks = Number(insight?.clicks ?? 0);
            const ctr = Number(insight?.ctr ?? 0);
            const leads = Number(insight?.actions?.find((a) => a.action_type === "lead")?.value ?? 0);
            const cpl = Number(insight?.cost_per_action_type?.find((a) => a.action_type === "lead")?.value ?? 0);

            const purchaseValue = insight?.action_values?.find((a) => a.action_type === "purchase")?.value;
            const roas = purchaseValue && spend > 0 ? Number(purchaseValue) / spend : null;

            return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                spend,
                impressions,
                reach,
                clicks,
                ctr,
                leads,
                cpl,
                roas,
            };
        });

        const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
        const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
        const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
        const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

        const campaignsWithRoas = campaigns.filter((c) => c.roas !== null);
        const avgRoas = campaignsWithRoas.length > 0 && totalSpend > 0
            ? campaignsWithRoas.reduce((sum, c) => sum + (c.roas ?? 0) * c.spend, 0) / totalSpend
            : null;

        return {
            connected: true,
            lastSyncedAt: new Date().toISOString(),
            dateRangeLabel: DATE_PRESET_LABEL,
            metrics: [
                { id: "spend", label: "ยอดใช้จ่าย", value: `฿${totalSpend.toLocaleString()}`, subtitle: DATE_PRESET_LABEL, color: "text-blue-400" },
                { id: "impressions", label: "Impressions", value: totalImpressions.toLocaleString(), subtitle: DATE_PRESET_LABEL, color: "text-cyan-400" },
                { id: "reach", label: "Reach", value: totalReach.toLocaleString(), subtitle: DATE_PRESET_LABEL, color: "text-teal-400" },
                { id: "clicks", label: "Clicks", value: totalClicks.toLocaleString(), subtitle: DATE_PRESET_LABEL, color: "text-indigo-400" },
                { id: "ctr", label: "CTR", value: `${avgCtr.toFixed(2)}%`, subtitle: "Click Through Rate", color: "text-purple-400" },
                { id: "leads", label: "Leads", value: totalLeads.toString(), subtitle: DATE_PRESET_LABEL, color: "text-green-400" },
                { id: "cpl", label: "Cost / Lead", value: totalLeads > 0 ? `฿${avgCpl.toFixed(2)}` : "-", subtitle: "Average", color: "text-yellow-400" },
                { id: "roas", label: "ROAS", value: avgRoas !== null ? avgRoas.toFixed(2) : "-", subtitle: "Purchase Value / Spend", color: "text-emerald-400" },
            ],
            table: {
                columns: [
                    { key: "name", label: "Campaign" },
                    { key: "spend", label: "Spend", align: "right" },
                    { key: "impressions", label: "Impressions", align: "right" },
                    { key: "reach", label: "Reach", align: "right" },
                    { key: "clicks", label: "Clicks", align: "right" },
                    { key: "ctr", label: "CTR", align: "right" },
                    { key: "leads", label: "Leads", align: "right" },
                    { key: "cpl", label: "CPL", align: "right" },
                    { key: "roas", label: "ROAS", align: "right" },
                    { key: "status", label: "Status", align: "center" },
                ],
                rows: campaigns.map((campaign) => ({
                    id: campaign.id,
                    name: campaign.name,
                    spend: `฿${campaign.spend.toLocaleString()}`,
                    impressions: campaign.impressions.toLocaleString(),
                    reach: campaign.reach.toLocaleString(),
                    clicks: campaign.clicks.toLocaleString(),
                    ctr: `${campaign.ctr.toFixed(2)}%`,
                    leads: campaign.leads,
                    cpl: campaign.leads > 0 ? `฿${campaign.cpl.toFixed(2)}` : "-",
                    roas: campaign.roas !== null ? campaign.roas.toFixed(2) : "-",
                    status: campaign.status,
                })),
            },
        };
    } catch (error) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อ Facebook API ได้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
}
