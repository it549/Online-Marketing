import { config } from "@/server/configurations/config";
import { GetCampaignsParams } from "@/server/types/meta/CampaignsParams";
import { MetaCampaignResponse } from "@/server/types/meta/MetaCampaignResponse";
import { getFacebookCampaignRepository } from "./facebook.repository";
import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { getCompanyById } from "@/server/modules/company/company.repository";

const DATE_PRESET_LABEL = "30 วันล่าสุด";

export interface FacebookAdAccountCredentials {
    adAccountId: string;
    accessToken: string;
}

export async function getFacebookApiPerformanceForCompany(companyId: bigint): Promise<ApiPerformanceResponse> {
    const company = await getCompanyById(companyId);
    const credentials = company?.facebookAdAccountId && company.facebookAccessToken
        ? { adAccountId: company.facebookAdAccountId, accessToken: company.facebookAccessToken }
        : null;
    return getFacebookApiPerformance(credentials);
}

export async function getFacebookApiPerformance(credentials: FacebookAdAccountCredentials | null): Promise<ApiPerformanceResponse> {
    if (!credentials) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: "ยังไม่ได้ตั้งค่า Facebook Ad Account สำหรับบริษัทนี้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }

    try {
        const params: GetCampaignsParams = {
            baseUrl: config.facebook.baseUrl,
            apiVersion: config.facebook.apiVersion,
            accessToken: credentials.accessToken,
            adAccountId: credentials.adAccountId,
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
            const purchases = Number(insight?.actions?.find((a) => a.action_type === "purchase")?.value ?? 0);
            const cpc = clicks > 0 ? spend / clicks : 0;

            const purchaseValue = insight?.action_values?.find((a) => a.action_type === "purchase")?.value;
            const revenue = purchaseValue ? Number(purchaseValue) : 0;
            const roas = revenue > 0 && spend > 0 ? revenue / spend : null;

            return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                spend,
                impressions,
                reach,
                clicks,
                ctr,
                cpc,
                leads,
                cpl,
                purchases,
                revenue,
                roas,
            };
        });

        const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
        const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
        const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
        const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
        const totalPurchases = campaigns.reduce((sum, c) => sum + c.purchases, 0);
        const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const avgRoas = totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : null;

        return {
            connected: true,
            lastSyncedAt: new Date().toISOString(),
            dateRangeLabel: DATE_PRESET_LABEL,
            metrics: [
                { id: "spend", label: "ยอดใช้จ่าย", value: `฿${totalSpend.toLocaleString()}`, subtitle: DATE_PRESET_LABEL, color: "text-blue-600" },
                { id: "revenue", label: "Revenue", value: `฿${totalRevenue.toLocaleString()}`, subtitle: "จาก Purchase Value", color: "text-green-600" },
                { id: "roas", label: "ROAS", value: avgRoas !== null ? avgRoas.toFixed(2) : "-", subtitle: "Revenue / Spend", color: "text-emerald-600" },
                { id: "reach", label: "Reach", value: totalReach.toLocaleString(), subtitle: DATE_PRESET_LABEL, color: "text-teal-600" },
                { id: "impressions", label: "Impressions", value: totalImpressions.toLocaleString(), subtitle: DATE_PRESET_LABEL, color: "text-cyan-600" },
                { id: "clicks", label: "Clicks", value: totalClicks.toLocaleString(), subtitle: `CTR ${avgCtr.toFixed(2)}%`, color: "text-indigo-600" },
                { id: "leads", label: "Leads", value: totalLeads.toString(), subtitle: totalLeads > 0 ? `CPL ฿${avgCpl.toFixed(2)}` : DATE_PRESET_LABEL, color: "text-purple-600" },
                { id: "purchases", label: "Purchases", value: totalPurchases.toString(), subtitle: DATE_PRESET_LABEL, color: "text-sky-600" },
            ],
            summary: {
                spend: totalSpend,
                leads: totalLeads,
                roas: avgRoas,
                revenue: totalRevenue,
                reach: totalReach,
                impressions: totalImpressions,
                clicks: totalClicks,
                purchases: totalPurchases,
            },
            campaigns: campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
                spend: campaign.spend,
                leads: campaign.leads,
                cpl: campaign.cpl,
                status: campaign.status,
            })),
            table: {
                columns: [
                    { key: "name", label: "Campaign" },
                    { key: "status", label: "Status", align: "center" },
                    { key: "spend", label: "Spend", align: "right" },
                    { key: "reach", label: "Reach", align: "right" },
                    { key: "ctr", label: "CTR", align: "right" },
                    { key: "cpc", label: "CPC", align: "right" },
                    { key: "leads", label: "Leads", align: "right" },
                    { key: "cpl", label: "CPL", align: "right" },
                    { key: "purchases", label: "Purchases", align: "right" },
                    { key: "roas", label: "ROAS", align: "right" },
                ],
                rows: campaigns.map((campaign) => ({
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    spend: `฿${campaign.spend.toLocaleString()}`,
                    reach: campaign.reach.toLocaleString(),
                    ctr: `${campaign.ctr.toFixed(2)}%`,
                    cpc: campaign.clicks > 0 ? `฿${campaign.cpc.toFixed(2)}` : "-",
                    leads: campaign.leads,
                    cpl: campaign.leads > 0 ? `฿${campaign.cpl.toFixed(2)}` : "-",
                    purchases: campaign.purchases,
                    roas: campaign.roas !== null ? campaign.roas.toFixed(2) : "-",
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
