import { ApiPerformanceResponse } from "@/types/apiPerformance";

interface CampaignPerformanceRow {
    campaign?: {
        name?: string | null;
    } | null;
    segments?: {
        date?: string | null;
    } | null;
    metrics?: {
        cost_micros?: number | string | null;
        impressions?: number | string | null;
        clicks?: number | string | null;
        conversions?: number | string | null;
        conversions_value?: number | string | null;
    } | null;
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === "string" ? Number(value) : value;
}

const TABLE_COLUMNS = [
    { key: "date", label: "วันที่" },
    { key: "campaign", label: "แคมเปญ" },
    { key: "cost", label: "ยอดใช้จ่าย", align: "right" as const },
    { key: "clicks", label: "Clicks", align: "right" as const },
    { key: "conversions", label: "Conversions", align: "right" as const },
    { key: "conversionsValue", label: "มูลค่า Conversion", align: "right" as const },
];

export function mapCampaignRowsToPerformance(
    rows: CampaignPerformanceRow[]
): ApiPerformanceResponse {
    let totalCost = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalConversionsValue = 0;
    let totalImpressions = 0;

    const tableRows = rows.map((row, index) => {
        const cost = toNumber(row.metrics?.cost_micros) / 1_000_000;
        const clicks = toNumber(row.metrics?.clicks);
        const conversions = toNumber(row.metrics?.conversions);
        const conversionsValue = toNumber(row.metrics?.conversions_value);
        const impressions = toNumber(row.metrics?.impressions);

        totalCost += cost;
        totalClicks += clicks;
        totalConversions += conversions;
        totalConversionsValue += conversionsValue;
        totalImpressions += impressions;

        const date = row.segments?.date ?? "";
        const campaign = row.campaign?.name ?? "";

        return {
            id: `${date}-${campaign}-${index}`, // TableRow บังคับต้องมี id: string
            date,
            campaign,
            cost: cost.toFixed(2),
            clicks,
            conversions,
            conversionsValue: conversionsValue.toFixed(2),
        };
    });

    const roas = totalCost > 0 ? totalConversionsValue / totalCost : 0;
    const cpa = totalConversions > 0 ? totalCost / totalConversions : 0;

    return {
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        dateRangeLabel: "30 วันล่าสุด",
        metrics: [
            { id: "total-cost", label: "ยอดใช้จ่าย", value: totalCost.toFixed(2) },
            { id: "impressions", label: "Impressions", value: totalImpressions },
            { id: "clicks", label: "Clicks", value: totalClicks },
            { id: "conversions", label: "Conversions", value: totalConversions.toFixed(2) },
            { id: "conversions-value", label: "Conversion Value", value: totalConversionsValue.toFixed(2) },
            { id: "roas", label: "ROAS", value: roas.toFixed(2) },
            { id: "cpa", label: "CPA", value: cpa.toFixed(2) },
        ],
        table: {
            columns: TABLE_COLUMNS,
            rows: tableRows,
        },
        summary: {
            spend: totalCost,
            leads: totalConversions,
            roas: totalCost > 0 ? roas : null,
        },
    };
}

export function emptyPerformanceResponse(): ApiPerformanceResponse {
    return {
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        dateRangeLabel: "30 วันล่าสุด",
        metrics: [],
        table: { columns: TABLE_COLUMNS, rows: [] },
    };
}