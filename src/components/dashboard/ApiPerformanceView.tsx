import { PlugZap, RefreshCw } from "lucide-react";
import DashboardLoading from "./DashboardLoading";
import DashboardError from "./DashboardError";
import DataSourceBadge from "./DataSourceBadge";
import MetricCards from "./MetricCards";
import DashboardTable from "./DashboardTable";
import { ApiPerformanceResponse } from "@/types/apiPerformance";

interface Props {
    data: ApiPerformanceResponse | null;
    loading: boolean;
    error: string | null;
    refetch?: () => void;
}

export default function ApiPerformanceView({ data, loading, error, refetch }: Props) {
    return (
        <div className="space-y-6">
            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <DataSourceBadge source="api" connected={data.connected} lastSyncedAt={data.lastSyncedAt} dateRangeLabel={data.dateRangeLabel} />

                    {!data.connected ? (
                        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-12 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                                <PlugZap className="h-7 w-7 text-amber-600" strokeWidth={2} />
                            </div>

                            <h3 className="text-base font-semibold text-slate-900">ยังไม่ได้เชื่อมต่อ API</h3>

                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                {data.error ?? "ระบบยังไม่สามารถเชื่อมต่อ API ของแพลตฟอร์มนี้ได้ จึงยังไม่มีข้อมูลแบบเรียลไทม์ให้แสดง"}
                            </p>

                            {refetch && (
                                <button
                                    onClick={refetch}
                                    disabled={loading}
                                    className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-500 disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
                                    ลองเชื่อมต่ออีกครั้ง
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <MetricCards metrics={data.metrics} />

                            <DashboardTable table={data.table} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
