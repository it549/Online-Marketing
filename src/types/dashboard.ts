import { DashboardMetric } from "./metric";
import { DashboardTable } from "./table";
import { Platform } from "./platform";

export interface DashboardData {
    platform: Platform;
    title: string;
    subtitle?: string;
    hasData?: boolean;
    metrics: DashboardMetric[];
    table: DashboardTable;
    secondaryTable?: {
        title: string;
        table: DashboardTable;
    };
}
