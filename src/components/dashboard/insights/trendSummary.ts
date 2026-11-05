import type { SpendTrendPoint } from "@/types/insights";

const MIN_POINTS_FOR_TREND = 4;

export interface TrendSummary {
    totalSpend: number;
    totalConversions: number;
    totalClicks: number;
    /** Average spend to get one conversion, across the whole range. Null when there are no conversions to divide by. */
    costPerConversion: number | null;
    /** conversions / clicks * 100. Null when there are no clicks to divide by. */
    conversionRatePct: number | null;
    /** False when there are too few daily points to compare an earlier period against a later one. */
    hasEnoughDataForTrend: boolean;
    /** % change in conversions, later half of the range vs earlier half. */
    conversionsChangePct: number | null;
    /** % change in spend, later half vs earlier half. */
    spendChangePct: number | null;
    /** % change in cost-per-conversion, later half vs earlier half. Negative means cost went down (good). */
    costPerConversionChangePct: number | null;
    /** Overall sentiment, based on the conversions trend. */
    direction: "up" | "down" | "flat" | null;
}

function pctChange(from: number, to: number): number {
    if (from > 0) return ((to - from) / from) * 100;
    if (to > 0) return 100;
    return 0;
}

function sum(points: SpendTrendPoint[], key: "spend" | "conversions" | "clicks"): number {
    return points.reduce((total, point) => total + point[key], 0);
}

/**
 * Turns a raw daily trend series into the plain-language deltas the Insights page's
 * "decision dashboard" needs (summary hero, KPI cards, trend chart conclusion) --
 * computed by splitting the selected range in half and comparing the two halves, so
 * every claim is a real number derived from data already on hand (no external
 * benchmark, no fabricated score).
 */
export function summarizeTrend(points: SpendTrendPoint[]): TrendSummary {
    const totalSpend = sum(points, "spend");
    const totalConversions = sum(points, "conversions");
    const totalClicks = sum(points, "clicks");
    const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : null;
    const conversionRatePct = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : null;

    const hasEnoughDataForTrend = points.length >= MIN_POINTS_FOR_TREND;

    let conversionsChangePct: number | null = null;
    let spendChangePct: number | null = null;
    let costPerConversionChangePct: number | null = null;
    let direction: TrendSummary["direction"] = null;

    if (hasEnoughDataForTrend) {
        const mid = Math.floor(points.length / 2);
        const firstHalf = points.slice(0, mid);
        const secondHalf = points.slice(mid);

        const firstConversions = sum(firstHalf, "conversions");
        const secondConversions = sum(secondHalf, "conversions");
        const firstSpend = sum(firstHalf, "spend");
        const secondSpend = sum(secondHalf, "spend");

        conversionsChangePct = pctChange(firstConversions, secondConversions);
        spendChangePct = pctChange(firstSpend, secondSpend);

        const firstCpa = firstConversions > 0 ? firstSpend / firstConversions : null;
        const secondCpa = secondConversions > 0 ? secondSpend / secondConversions : null;
        costPerConversionChangePct = firstCpa !== null && secondCpa !== null ? pctChange(firstCpa, secondCpa) : null;

        direction = conversionsChangePct > 5 ? "up" : conversionsChangePct < -5 ? "down" : "flat";
    }

    return {
        totalSpend,
        totalConversions,
        totalClicks,
        costPerConversion,
        conversionRatePct,
        hasEnoughDataForTrend,
        conversionsChangePct,
        spendChangePct,
        costPerConversionChangePct,
        direction,
    };
}
