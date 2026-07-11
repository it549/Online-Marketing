import { DashboardMetric } from "./metric";
import { DashboardTable } from "./table";
import { Platform } from "./platform";

export interface DashboardData {
    platform: Platform;
    title: string;
    metrics: DashboardMetric[];
    table: DashboardTable;
}
