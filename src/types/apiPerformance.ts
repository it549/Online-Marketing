import { DashboardMetric } from "./metric";
import { DashboardTable } from "./table";

export interface ApiPerformanceCampaign {
    id: string;
    name: string;
    spend: number;
    leads: number;
    cpl: number;
    status: string;
}

export interface ApiPerformanceResponse {
    connected: boolean;
    lastSyncedAt: string | null;
    dateRangeLabel: string | null;
    error?: string;
    metrics: DashboardMetric[];
    table: DashboardTable;
    /** Raw totals for cross-platform aggregation (Overview page). Only present when connected. */
    summary?: {
        spend: number;
        leads: number;
        roas: number | null;
    };
    /** Raw per-campaign numbers for cross-platform aggregation (Overview page). Only present when connected. */
    campaigns?: ApiPerformanceCampaign[];
}
