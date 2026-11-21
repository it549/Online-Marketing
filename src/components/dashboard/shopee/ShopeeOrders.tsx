"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardTable from "../DashboardTable";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";

type OutcomeFilter = "all" | "completed" | "failed";

const OUTCOME_OPTIONS: { value: OutcomeFilter; label: string }[] = [
    { value: "all", label: "ทั้งหมด" },
    { value: "completed", label: "สำเร็จ" },
    { value: "failed", label: "ไม่สำเร็จ" },
];

/** Every Shopee order in the range, any status. Shares the Overview tab's request, so opening this tab costs no extra Shopee calls. */
export default function ShopeeOrders({ month = "" }: { month?: string }) {
    const { data, loading, error, refetch } = useShopeeApiPerformance(month);
    const [outcome, setOutcome] = useState<OutcomeFilter>("all");
    const table = data?.ordersTable;
    const countOf = (value: OutcomeFilter) => (table ? table.rows.filter((row) => value === "all" || row.outcome === value).length : 0);
    const filtered = table && { ...table, rows: table.rows.filter((row) => outcome === "all" || row.outcome === outcome) };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        {OUTCOME_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setOutcome(option.value)}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                    outcome === option.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {option.label}
                                {table && <span className="ml-1 opacity-75">({countOf(option.value).toLocaleString()})</span>}
                            </button>
                        ))}
                    </div>
                    <div className="text-sm text-slate-500">{data?.connected && data.dateRangeLabel && <>ออเดอร์ที่สั่ง{data.dateRangeLabel}</>}</div>
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

            {loading && !data && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && !data.connected && <DashboardError message={data.error ?? "ดึงออเดอร์จาก Shopee ไม่สำเร็จ"} />}

            {data?.connected && !table && <DashboardError message="ดึงออเดอร์จาก Shopee ไม่สำเร็จ" />}

            {data?.connected && filtered && (
                <DashboardTable title={`ออเดอร์ (${filtered.rows.length.toLocaleString()})`} table={filtered} />
            )}
        </div>
    );
}
