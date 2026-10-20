import { ApiPerformanceResponse } from "@/types/apiPerformance";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { TIKTOK_API_BASE_URL } from "./tiktokIntegration.service";

const DATE_RANGE_LABEL = "30 วันล่าสุด";
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TikTokAdsCredentials {
    advertiserId: string;
    accessToken: string;
}

interface TikTokReportRow {
    dimensions: { campaign_id: string };
    metrics: { campaign_name?: string; spend?: string; impressions?: string; clicks?: string; conversion?: string };
}

export async function getTikTokApiPerformanceForCompany(companyId: bigint): Promise<ApiPerformanceResponse> {
    const company = await getCompanyById(companyId);
    const credentials = company?.tiktokAdvertiserId && company.tiktokAccessToken
        ? { advertiserId: company.tiktokAdvertiserId, accessToken: company.tiktokAccessToken }
        : null;
    return getTikTokApiPerformance(credentials);
}

export async function getTikTokApiPerformance(credentials: TikTokAdsCredentials | null): Promise<ApiPerformanceResponse> {
    if (!credentials) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: "ยังไม่ได้เชื่อมต่อ TikTok กับบริษัทนี้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }

    try {
        const end = new Date();
        const start = new Date(end.getTime() - 29 * DAY_MS);
        const url = new URL(`${TIKTOK_API_BASE_URL}/report/integrated/get/`);
        url.searchParams.set("advertiser_id", credentials.advertiserId);
        url.searchParams.set("report_type", "BASIC");
        url.searchParams.set("data_level", "AUCTION_CAMPAIGN");
        url.searchParams.set("dimensions", JSON.stringify(["campaign_id"]));
        url.searchParams.set("metrics", JSON.stringify(["campaign_name", "spend", "impressions", "clicks", "conversion"]));
        url.searchParams.set("start_date", start.toISOString().slice(0, 10));
        url.searchParams.set("end_date", end.toISOString().slice(0, 10));
        url.searchParams.set("page_size", "200");

        const response = await fetch(url.toString(), { headers: { "Access-Token": credentials.accessToken } });
        const body = await response.json();
        if (!response.ok || body?.code !== 0) {
            throw new Error(body?.message ?? "TikTok API Error");
        }

        const campaigns = ((body.data?.list ?? []) as TikTokReportRow[]).map((row) => {
            const spend = Number(row.metrics.spend ?? 0);
            const impressions = Number(row.metrics.impressions ?? 0);
            const clicks = Number(row.metrics.clicks ?? 0);
            const leads = Number(row.metrics.conversion ?? 0);
            return {
                id: row.dimensions.campaign_id,
                name: row.metrics.campaign_name ?? row.dimensions.campaign_id,
                spend,
                impressions,
                clicks,
                ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                leads,
                cpl: leads > 0 ? spend / leads : 0,
            };
        });

        const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
        const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
        const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
        const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

        return {
            connected: true,
            lastSyncedAt: new Date().toISOString(),
            dateRangeLabel: DATE_RANGE_LABEL,
            metrics: [
                { id: "spend", label: "ยอดใช้จ่าย", value: `฿${totalSpend.toLocaleString()}`, subtitle: DATE_RANGE_LABEL, color: "text-blue-600" },
                { id: "impressions", label: "Impressions", value: totalImpressions.toLocaleString(), subtitle: DATE_RANGE_LABEL, color: "text-cyan-600" },
                { id: "clicks", label: "Clicks", value: totalClicks.toLocaleString(), subtitle: `CTR ${avgCtr.toFixed(2)}%`, color: "text-indigo-600" },
                { id: "leads", label: "Conversions", value: totalLeads.toString(), subtitle: totalLeads > 0 ? `CPA ฿${avgCpl.toFixed(2)}` : DATE_RANGE_LABEL, color: "text-purple-600" },
            ],
            summary: {
                spend: totalSpend,
                leads: totalLeads,
                roas: null,
                impressions: totalImpressions,
                clicks: totalClicks,
            },
            campaigns: campaigns.map((c) => ({
                id: c.id,
                name: c.name,
                spend: c.spend,
                leads: c.leads,
                cpl: c.cpl,
                status: "-",
            })),
            table: {
                columns: [
                    { key: "name", label: "Campaign" },
                    { key: "spend", label: "Spend", align: "right" },
                    { key: "impressions", label: "Impressions", align: "right" },
                    { key: "ctr", label: "CTR", align: "right" },
                    { key: "leads", label: "Conversions", align: "right" },
                    { key: "cpl", label: "CPA", align: "right" },
                ],
                rows: campaigns.map((c) => ({
                    id: c.id,
                    name: c.name,
                    spend: `฿${c.spend.toLocaleString()}`,
                    impressions: c.impressions.toLocaleString(),
                    ctr: `${c.ctr.toFixed(2)}%`,
                    leads: c.leads,
                    cpl: c.leads > 0 ? `฿${c.cpl.toFixed(2)}` : "-",
                })),
            },
        };
    } catch (error) {
        return {
            connected: false,
            lastSyncedAt: null,
            dateRangeLabel: null,
            error: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อ TikTok API ได้",
            metrics: [],
            table: { columns: [], rows: [] },
        };
    }
}
