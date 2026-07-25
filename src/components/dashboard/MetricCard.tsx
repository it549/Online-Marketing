import { DashboardMetric } from "@/types/metric";

interface Props {
    metric: DashboardMetric;
}

export default function MetricCard({ metric }: Props) {
    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <p className="mb-1 text-xs text-slate-400">{metric.label}</p>

            <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>

            {metric.subtitle && <p className="mt-1 text-xs text-slate-500">{metric.subtitle}</p>}
        </div>
    );
}
