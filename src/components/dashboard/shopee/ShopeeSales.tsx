"use client";

import { RefreshCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardTable from "../DashboardTable";
import MetricCards from "../MetricCards";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";

/** Profit/loss of everything sold in the month, per product. Shares the Overview tab's request, so opening this tab costs no extra Shopee calls. */
export default function ShopeeSales({ month = "" }: { month?: string }) {
    const { data, loading, error, refetch } = useShopeeApiPerformance(month);
    const table = data?.salesTable;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">
                    {data?.connected && data.dateRangeLabel && <>สินค้าที่ขายออกจากออเดอร์ที่สั่ง{data.dateRangeLabel} (นับเฉพาะออเดอร์สำเร็จ)</>}
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

            {data && !data.connected && <DashboardError message={data.error ?? "ดึงยอดขายจาก Shopee ไม่สำเร็จ"} />}

            {data?.connected && !table && <DashboardError message="ดึงออเดอร์จาก Shopee ไม่สำเร็จ" />}

            {data?.connected && data.salesMetrics && <MetricCards metrics={data.salesMetrics} />}

            {data?.connected && table && (
                <>
                    <DashboardTable title={`กำไร/ขาดทุนรายสินค้า (${table.rows.filter((row) => row.id.startsWith("item-")).length.toLocaleString()} สินค้า)`} table={table} />
                    <p className="text-xs text-slate-400">
                        เงินที่ได้รับจริงของแต่ละออเดอร์แบ่งให้สินค้าตามสัดส่วนยอดขาย · ค่าโฆษณาของแต่ละแคมเปญแบ่งเท่าๆ กันให้สินค้าที่แคมเปญนั้นโปรโมต
                    </p>
                </>
            )}
        </div>
    );
}
