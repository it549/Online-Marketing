"use client";

import { RefreshCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardTable from "../DashboardTable";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";

/** Payout per completed order (Payment API escrow). Shares the Overview tab's request, so opening this tab costs no extra Shopee calls. */
export default function ShopeePayments() {
    const { data, loading, error, refetch } = useShopeeApiPerformance();
    const table = data?.paymentsTable;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">
                    {data?.connected && data.dateRangeLabel && <>ออเดอร์สำเร็จ{data.dateRangeLabel}</>}
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

            {data && !data.connected && <DashboardError message={data.error ?? "ดึงข้อมูลการเงินจาก Shopee ไม่สำเร็จ"} />}

            {data?.connected && !table && <DashboardError message="ดึงออเดอร์สำเร็จจาก Shopee ไม่ได้ จึงยังไม่มีข้อมูลการเงิน" />}

            {data?.connected && table && (
                <DashboardTable title={`เงินที่ได้รับต่อออเดอร์ (${table.rows.length.toLocaleString()})`} table={table} />
            )}
        </div>
    );
}
