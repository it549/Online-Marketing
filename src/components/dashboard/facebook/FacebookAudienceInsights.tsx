"use client";

import { useAudienceBreakdown } from "@/hooks/useAudienceBreakdown";
import type { AudienceBreakdownRow } from "@/types/insights";

const BAR_COLOR = "#4f46e5";

function BreakdownPanel({ title, rows }: { title: string; rows: AudienceBreakdownRow[] }) {
    const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    const top = [...rows].sort((a, b) => b.impressions - a.impressions).slice(0, 5);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">By Impressions</p>

            <div className="mt-4 space-y-3">
                {top.map((row) => {
                    const pct = totalImpressions > 0 ? (row.impressions / totalImpressions) * 100 : 0;

                    return (
                        <div key={row.dimensionValue}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="truncate text-slate-600">{row.dimensionValue}</span>
                                <span className="shrink-0 font-medium text-slate-900">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: BAR_COLOR }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface Props {
    dateFrom: string;
    dateTo: string;
}

export default function FacebookAudienceInsights({ dateFrom, dateTo }: Props) {
    const age = useAudienceBreakdown("facebook", "AGE", dateFrom, dateTo);
    const gender = useAudienceBreakdown("facebook", "GENDER", dateFrom, dateTo);
    const region = useAudienceBreakdown("facebook", "REGION", dateFrom, dateTo);
    const placement = useAudienceBreakdown("facebook", "PUBLISHER_PLATFORM", dateFrom, dateTo);

    const panels = [
        { title: "อายุ", result: age },
        { title: "เพศ", result: gender },
        { title: "ภูมิภาค", result: region },
        { title: "ตำแหน่งโฆษณา", result: placement },
    ].filter((panel) => panel.result.data?.hasDataInRange && panel.result.data.rows.length > 0);

    if (panels.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Audience Insights</h3>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {panels.map((panel) => (
                    <BreakdownPanel key={panel.title} title={panel.title} rows={panel.result.data!.rows} />
                ))}
            </div>
        </div>
    );
}
