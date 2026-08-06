interface Props {
    impressions: number;
    reach: number;
    clicks: number;
    leads: number;
}

const STAGES: { key: keyof Props; label: string; color: string }[] = [
    { key: "impressions", label: "Impressions", color: "#2563eb" },
    { key: "reach", label: "Reach", color: "#0891b2" },
    { key: "clicks", label: "Clicks", color: "#059669" },
    { key: "leads", label: "Leads", color: "#f59e0b" },
];

export default function FacebookMarketingFunnel(props: Props) {
    const first = props.impressions;

    if (first <= 0) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Marketing Funnel</h3>
            <p className="mt-0.5 text-xs text-slate-400">เส้นทางจากคนเห็นโฆษณาไปจนถึง Lead</p>

            <div className="mt-5 space-y-3">
                {STAGES.map((stage, index) => {
                    const value = props[stage.key];
                    const widthPct = Math.max(first > 0 ? (value / first) * 100 : 0, 4);
                    const prevValue = index > 0 ? props[STAGES[index - 1].key] : null;
                    const dropPct = prevValue && prevValue > 0 ? ((prevValue - value) / prevValue) * 100 : null;

                    return (
                        <div key={stage.key}>
                            <div className="mb-1 flex items-baseline justify-between text-xs">
                                <span className="font-medium text-slate-500">{stage.label}</span>
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{value.toLocaleString()}</span>
                                    {dropPct !== null && <span className="text-slate-400">↓{dropPct.toFixed(1)}%</span>}
                                </span>
                            </div>

                            <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100">
                                <div
                                    className="h-full rounded-md transition-all"
                                    style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
