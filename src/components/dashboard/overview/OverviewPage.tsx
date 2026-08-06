"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import MetricCards from "../MetricCards";
import DashboardTable from "../DashboardTable";
import OverviewPlatformBreakdown from "./OverviewPlatformBreakdown";
import OverviewInsightHero from "./OverviewInsightHero";
import OverviewPriorityActions from "./OverviewPriorityActions";
import OverviewOpportunity from "./OverviewOpportunity";
import InsightsDateRangePicker from "../insights/InsightsDateRangePicker";
import InsightsKpiCards from "../insights/InsightsKpiCards";
import InsightsTrendChart from "../insights/InsightsTrendChart";
import { summarizeTrend } from "../insights/trendSummary";
import { computeOverviewSignals } from "./overviewSignals";

import { useOverview } from "@/hooks/useOverview";
import { useOverviewInsight } from "@/hooks/useOverviewInsight";
import { DashboardMetric } from "@/types/metric";
import { OverviewPlatformSummary, OverviewTotals } from "@/types/overview";

const PLATFORM_LABEL: Record<string, string> = { facebook: "Facebook", tiktok: "TikTok" };

function getDefaultDateRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

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
            label: "ยอดขายจากโฆษณา (Shopee)",
            value: `฿${totals.shopeeRevenue.toLocaleString()}`,
            subtitle: "จาก Shopee Ads API",
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
    const [range, setRange] = useState(getDefaultDateRange);
    const { data, loading, error, refetch } = useOverview();
    const { data: insight, loading: insightLoading, refetch: refetchInsight } = useOverviewInsight(range.dateFrom, range.dateTo);
    const [showDetail, setShowDetail] = useState(false);

    const trendSummary = insight?.hasDataInRange ? summarizeTrend(insight.points) : null;
    const signals = computeOverviewSignals(data?.topCampaigns ?? [], data?.platforms ?? [], insight?.leadsSummary ?? null, trendSummary?.totalSpend ?? 0);

    function handleRefresh() {
        refetch();
        refetchInsight();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">ภาพรวมการตลาด</h1>
                    <p className="mt-1 text-sm text-slate-500">สรุปสิ่งที่ควรรู้และควรทำวันนี้ จากข้อมูลทุกแพลตฟอร์ม</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <InsightsDateRangePicker dateFrom={range.dateFrom} dateTo={range.dateTo} onChange={setRange} />

                    <button
                        onClick={handleRefresh}
                        disabled={loading || insightLoading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading || insightLoading ? "animate-spin" : ""}`} strokeWidth={2} />
                        รีเฟรช
                    </button>
                </div>
            </div>

            {loading && !data && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <OverviewInsightHero hasSyncedBefore={insight?.hasSyncedBefore ?? false} pointCount={insight?.points.length ?? 0} summary={trendSummary} signals={signals} />

                    <OverviewPriorityActions signals={signals} />

                    {trendSummary && <InsightsKpiCards summary={trendSummary} />}

                    <OverviewOpportunity signals={signals} />

                    {insight && insight.points.length > 0 && <InsightsTrendChart points={insight.points} />}

                    <div>
                        <button
                            onClick={() => setShowDetail((v) => !v)}
                            className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
                        >
                            {showDetail ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            ดูข้อมูลรายละเอียดทั้งหมด
                        </button>

                        {showDetail && (
                            <div className="space-y-6">
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
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
