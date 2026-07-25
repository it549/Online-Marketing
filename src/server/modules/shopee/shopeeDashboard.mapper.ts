import {
    ShopeeAvailableFilters, ShopeeDashboardBucket, ShopeeDashboardResponse, ShopeeDashboardSummary, ShopeeImportBatch, ShopeePeriodGranularity,
} from "@/types/shopeeDashboard";
import { ShopeeBucketAccumulator } from "./shopeeDashboard.bucket";

interface RawShopeeDashboard {
    hasData: boolean;
    granularity: ShopeePeriodGranularity;
    buckets: ShopeeBucketAccumulator[];
}

interface RawShopeeImportJob {
    id: bigint;
    filename: string;
    importedAt: Date | null;
    totalRecords: number;
    reportStartDate: Date;
    reportEndDate: Date;
}

export function mapShopeeDashboard(
    raw: RawShopeeDashboard,
    availableFilters: ShopeeAvailableFilters,
    importJobs: RawShopeeImportJob[] = [],
): ShopeeDashboardResponse {
    const buckets: ShopeeDashboardBucket[] = raw.buckets.map((bucket) => ({
        periodLabel: formatBucketLabel(raw.granularity, bucket.periodStart, bucket.periodEnd),
        periodStart: bucket.periodStart.toISOString(),
        periodEnd: bucket.periodEnd.toISOString(),
        spend: bucket.spend,
        revenue: bucket.revenue,
        profit: bucket.revenue - bucket.spend,
        roas: bucket.spend > 0 ? bucket.revenue / bucket.spend : null,
        orders: bucket.orders,
        ctr: bucket.impressions > 0 ? (bucket.clicks / bucket.impressions) * 100 : null,
    }));

    const summary: ShopeeDashboardSummary = buckets.reduce(
        (acc, bucket) => {
            acc.spend += bucket.spend;
            acc.revenue += bucket.revenue;
            acc.orders += bucket.orders;
            return acc;
        },
        { spend: 0, revenue: 0, profit: 0, roas: null, orders: 0, ctr: null } as ShopeeDashboardSummary,
    );

    summary.profit = summary.revenue - summary.spend;
    summary.roas = summary.spend > 0 ? summary.revenue / summary.spend : null;

    const totalClicks = raw.buckets.reduce((sum, b) => sum + b.clicks, 0);
    const totalImpressions = raw.buckets.reduce((sum, b) => sum + b.impressions, 0);
    summary.ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;

    const importBatches: ShopeeImportBatch[] = importJobs.map((job) => ({
        id: job.id.toString(),
        filename: job.filename,
        importedAt: job.importedAt ? job.importedAt.toISOString() : null,
        totalRecords: job.totalRecords,
        periodLabel: formatPeriod(job.reportStartDate, job.reportEndDate),
    }));

    return {
        hasData: raw.hasData,
        granularity: raw.granularity,
        summary,
        buckets,
        availableFilters,
        importBatches,
    };
}

function formatPeriod(start: Date, end: Date): string {
    const startLabel = start.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    return `${startLabel} - ${endLabel}`;
}

function formatBucketLabel(granularity: ShopeePeriodGranularity, start: Date, end: Date): string {
    if (granularity === "month") {
        return start.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
    }

    if (granularity === "quarter") {
        const quarterNumber = Math.floor(start.getMonth() / 3) + 1;
        return `Q${quarterNumber} ${start.getFullYear()}`;
    }

    const startLabel = start.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    const endLabel = end.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    return `${startLabel} - ${endLabel}`;
}
