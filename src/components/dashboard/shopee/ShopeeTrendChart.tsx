import { ShopeeDashboardBucket } from "@/types/shopeeDashboard";

interface Props {
    buckets: ShopeeDashboardBucket[];
}

// Blue/orange categorical pair, tuned for contrast on a white chart surface.
const SPEND_COLOR = "#4f46e5";
const REVENUE_COLOR = "#ea580c";

const CHART_HEIGHT = 200;
const BAR_MAX_WIDTH = 24;
const BAR_GAP = 2;
const GROUP_GAP = 20;

export default function ShopeeTrendChart({ buckets }: Props) {
    if (buckets.length === 0) {
        return null;
    }

    const maxValue = Math.max(1, ...buckets.flatMap((bucket) => [bucket.spend, bucket.revenue]));
    const groupWidth = BAR_MAX_WIDTH * 2 + BAR_GAP;
    const chartWidth = buckets.length * (groupWidth + GROUP_GAP);

    function barHeight(value: number): number {
        return maxValue > 0 ? (value / maxValue) * (CHART_HEIGHT - 24) : 0;
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SPEND_COLOR }} />
                    ค่าโฆษณา
                </span>

                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REVENUE_COLOR }} />
                    ยอดขาย
                </span>
            </div>

            <div className="overflow-x-auto">
                <svg width={Math.max(chartWidth, 240)} height={CHART_HEIGHT + 32} role="img" aria-label="กราฟค่าโฆษณาและยอดขายตามช่วงเวลา">
                    <line
                        x1={0}
                        y1={CHART_HEIGHT - 24}
                        x2={Math.max(chartWidth, 240)}
                        y2={CHART_HEIGHT - 24}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                    />

                    {buckets.map((bucket, index) => {
                        const groupX = index * (groupWidth + GROUP_GAP);
                        const spendHeight = barHeight(bucket.spend);
                        const revenueHeight = barHeight(bucket.revenue);
                        const baseline = CHART_HEIGHT - 24;

                        return (
                            <g key={bucket.periodStart}>
                                <rect
                                    x={groupX}
                                    y={baseline - spendHeight}
                                    width={BAR_MAX_WIDTH}
                                    height={spendHeight}
                                    rx={4}
                                    fill={SPEND_COLOR}
                                >
                                    <title>{`${bucket.periodLabel} — ค่าโฆษณา ฿${bucket.spend.toLocaleString()}`}</title>
                                </rect>

                                <rect
                                    x={groupX + BAR_MAX_WIDTH + BAR_GAP}
                                    y={baseline - revenueHeight}
                                    width={BAR_MAX_WIDTH}
                                    height={revenueHeight}
                                    rx={4}
                                    fill={REVENUE_COLOR}
                                >
                                    <title>{`${bucket.periodLabel} — ยอดขาย ฿${bucket.revenue.toLocaleString()}`}</title>
                                </rect>

                                <text
                                    x={groupX + groupWidth / 2}
                                    y={CHART_HEIGHT}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="#94a3b8"
                                >
                                    {bucket.periodLabel}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
