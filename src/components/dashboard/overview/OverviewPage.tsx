"use client";

import { RefreshCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import MetricCards from "../MetricCards";
import DashboardTable from "../DashboardTable";
import OverviewPlatformBreakdown from "./OverviewPlatformBreakdown";

import { useOverview } from "@/hooks/useOverview";
import { DashboardMetric } from "@/types/metric";
import { OverviewPlatformSummary, OverviewTotals } from "@/types/overview";

const PLATFORM_LABEL: Record<string, string> = { facebook: "Facebook", tiktok: "TikTok" };

function buildMetrics(totals: OverviewTotals, platforms: OverviewPlatformSummary[]): DashboardMetric[] {
    const hasShopee = platforms.some((p) => p.id === "shopee");
    const leadSources = platforms.filter((p) => p.id !== "shopee").map((p) => p.name);
    const roasSources = platforms.filter((p) => p.id === "facebook" || p.id === "shopee").map((p) => p.name);

    const metrics: DashboardMetric[] = [
        { id: "spend", label: "ค่าโฆษณารวม", value: `฿${totals.spend.toLocaleString()}`, subtitle: "ทุกแพลตฟอร์ม", color: "text-blue-600" },
    ];

    if (hasShopee) {
        metrics.push({
            id: "revenue",
            label: "ยอดขายรวม (Shopee)",
            value: `฿${totals.shopeeRevenue.toLocaleString()}`,
            subtitle: "จากไฟล์นำเข้า",
            color: "text-emerald-600",
        });
    }

    metrics.push({ id: "leads", label: "Leads รวม", value: totals.leads.toLocaleString(), subtitle: leadSources.join(" + "), color: "text-green-600" });

    metrics.push({
        id: "roas",
        label: "ROAS เฉลี่ย",
        value: totals.avgRoas !== null ? `${totals.avgRoas.toFixed(2)}x` : "-",
        subtitle: totals.avgCpl !== null ? `CPL เฉลี่ย ฿${totals.avgCpl.toFixed(0)}` : roasSources.join(" + "),
        color: "text-purple-600",
    });

    return metrics;
}

export default function OverviewPage() {
    const { data, loading, error, refetch } = useOverview();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">ภาพรวมการตลาด</h1>
                    <p className="mt-1 text-sm text-slate-500">สรุปผลรวมทุกแพลตฟอร์มจากข้อมูลปัจจุบัน</p>
                </div>

                <button
                    onClick={refetch}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
                    รีเฟรช
                </button>
            </div>

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <MetricCards metrics={buildMetrics(data.totals, data.platforms)} />

                    <OverviewPlatformBreakdown platforms={data.platforms} />

                    <DashboardTable
                        title="แคมเปญที่ใช้งบสูงสุด"
                        table={{
                            columns: [
                                { key: "name", label: "แคมเปญ" },
                                { key: "platform", label: "แพลตฟอร์ม" },
                                { key: "spend", label: "ค่าใช้จ่าย", align: "right" },
                                { key: "leads", label: "Leads", align: "right" },
                                { key: "cpl", label: "CPL", align: "right" },
                                { key: "status", label: "สถานะ", align: "center" },
                            ],
                            rows: data.topCampaigns.map((campaign) => ({
                                id: campaign.id,
                                name: campaign.name,
                                platform: PLATFORM_LABEL[campaign.platform] ?? campaign.platform,
                                spend: `฿${campaign.spend.toLocaleString()}`,
                                leads: campaign.leads,
                                cpl: `฿${campaign.cpl.toLocaleString()}`,
                                status: campaign.status,
                            })),
                        }}
                    />
                </>
            )}
        </div>
    );
}
