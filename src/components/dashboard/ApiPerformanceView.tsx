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
}

export default function ApiPerformanceView({ data, loading, error }: Props) {
    return (
        <div className="space-y-6">
            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <DataSourceBadge source="api" connected={data.connected} lastSyncedAt={data.lastSyncedAt} dateRangeLabel={data.dateRangeLabel} />

                    {!data.connected ? (
                        <div className="rounded-xl border border-dashed border-amber-700 bg-amber-950/20 px-6 py-12 text-center">
                            <p className="text-amber-300">{data.error ?? "ไม่สามารถเชื่อมต่อ API ได้"}</p>
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
