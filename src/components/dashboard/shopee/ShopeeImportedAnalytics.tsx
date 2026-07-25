"use client";

import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardEmptyState from "../DashboardEmptyState";
import DataSourceBadge from "../DataSourceBadge";
import ImportedFilesPanel from "../ImportedFilesPanel";
import MetricCards from "../MetricCards";
import DashboardTable from "../DashboardTable";
import ImportCsvButton from "../ImportCsvButton";
import ShopeePeriodToggle from "./ShopeePeriodToggle";
import ShopeeFilters from "./ShopeeFilters";
import ShopeeTrendChart from "./ShopeeTrendChart";

import { useShopeeDashboard } from "@/hooks/useShopeeDashboard";
import { IMPORT_CONFIG_BY_PLATFORM } from "@/constants/importConfig";
import { DashboardMetric } from "@/types/metric";

const IMPORT_CONFIG = IMPORT_CONFIG_BY_PLATFORM.shopee;

export default function ShopeeImportedAnalytics() {
    const { data, loading, error, period, setPeriod, filters, setFilters, refetch } = useShopeeDashboard();

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ShopeePeriodToggle value={period} onChange={setPeriod} />

                <ImportCsvButton onImported={refetch} endpoint={IMPORT_CONFIG.endpoint} platforms={IMPORT_CONFIG.platforms} />
            </div>

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && data.hasData === false && (
                <DashboardEmptyState onImported={refetch} endpoint={IMPORT_CONFIG.endpoint} platforms={IMPORT_CONFIG.platforms} />
            )}

            {data && data.hasData && (
                <>
                    <DataSourceBadge
                        source="imported"
                        fileCount={data.importBatches.length}
                        latestImportedAt={data.importBatches[0]?.importedAt ?? null}
                    />

                    <ImportedFilesPanel batches={data.importBatches} />

                    <ShopeeFilters filters={filters} availableFilters={data.availableFilters} onChange={setFilters} />

                    {data.buckets.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 px-6 py-12 text-center text-slate-400">
                            ไม่พบข้อมูลตรงกับตัวกรองที่เลือก
                        </div>
                    ) : (
                        <>
                            <MetricCards metrics={buildSummaryMetrics(data.summary)} />

                            <ShopeeTrendChart buckets={data.buckets} />

                            <DashboardTable
                                title="สรุปตามช่วงเวลา"
                                table={{
                                    columns: [
                                        { key: "period", label: "ช่วงเวลา" },
                                        { key: "spend", label: "ค่าโฆษณา", align: "right" },
                                        { key: "revenue", label: "ยอดขาย", align: "right" },
                                        { key: "profit", label: "กำไร/ขาดทุน", align: "right" },
                                        { key: "roas", label: "ROAS", align: "right" },
                                        { key: "orders", label: "คำสั่งซื้อ", align: "right" },
                                    ],

                                    rows: data.buckets.map((bucket) => ({
                                        id: bucket.periodStart,
                                        period: bucket.periodLabel,
                                        spend: `฿${bucket.spend.toLocaleString()}`,
                                        revenue: `฿${bucket.revenue.toLocaleString()}`,
                                        profit: `${bucket.profit >= 0 ? "+" : "-"}฿${Math.abs(bucket.profit).toLocaleString()}`,
                                        roas: bucket.roas !== null ? bucket.roas.toFixed(2) : "-",
                                        orders: bucket.orders,
                                    })),
                                }}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function buildSummaryMetrics(summary: {
    spend: number; revenue: number; profit: number; roas: number | null; orders: number; ctr: number | null;
}): DashboardMetric[] {
    return [
        {
            id: "spend",
            label: "ยอดใช้จ่าย",
            value: `฿${summary.spend.toLocaleString()}`,
            subtitle: "ตามตัวกรองที่เลือก",
            color: "text-blue-400",
        },

        {
            id: "revenue",
            label: "ยอดขาย",
            value: `฿${summary.revenue.toLocaleString()}`,
            subtitle: "ตามตัวกรองที่เลือก",
            color: "text-green-400",
        },

        {
            id: "profit",
            label: summary.profit >= 0 ? "กำไร" : "ขาดทุน",
            value: `฿${Math.abs(summary.profit).toLocaleString()}`,
            subtitle: "ยอดขาย − ค่าโฆษณา",
            color: summary.profit >= 0 ? "text-emerald-400" : "text-red-400",
        },

        {
            id: "roas",
            label: "ROAS",
            value: summary.roas !== null ? summary.roas.toFixed(2) : "-",
            subtitle: "ยอดขาย / ค่าโฆษณา",
            color: "text-purple-400",
        },

        {
            id: "orders",
            label: "คำสั่งซื้อ",
            value: summary.orders.toLocaleString(),
            subtitle: "ตามตัวกรองที่เลือก",
            color: "text-yellow-400",
        },

        {
            id: "ctr",
            label: "CTR",
            value: summary.ctr !== null ? `${summary.ctr.toFixed(2)}%` : "-",
            subtitle: "Click Through Rate",
            color: "text-cyan-400",
        },
    ];
}
