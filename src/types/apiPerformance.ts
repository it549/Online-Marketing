import { DashboardMetric } from "./metric";
import { DashboardTable } from "./table";

export interface ApiPerformanceResponse {
    connected: boolean;
    lastSyncedAt: string | null;
    dateRangeLabel: string | null;
    error?: string;
    metrics: DashboardMetric[];
    table: DashboardTable;
}
