import { ShopeePeriodGranularity } from "@/types/shopeeDashboard";

export interface BucketRange {
    start: Date;
    end: Date;
}

export interface ShopeeBucketAccumulator {
    periodStart: Date;
    periodEnd: Date;
    spend: number;
    revenue: number;
    orders: number;
    clicks: number;
    impressions: number;
}

function getWeekStart(date: Date): Date {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = start.getDay();
    const diffFromMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffFromMonday);
    return start;
}

function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getQuarterStart(date: Date): Date {
    const quarterIndex = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarterIndex * 3, 1);
}

export function getBucketRange(granularity: ShopeePeriodGranularity, date: Date): BucketRange {
    switch (granularity) {
        case "week": {
            const start = getWeekStart(date);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return { start, end };
        }

        case "month": {
            const start = getMonthStart(date);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            return { start, end };
        }

        case "quarter": {
            const start = getQuarterStart(date);
            const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
            return { start, end };
        }
    }
}

export function getBucketKey(range: BucketRange): string {
    return range.start.toISOString().slice(0, 10);
}
