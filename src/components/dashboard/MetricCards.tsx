import { DashboardMetric } from "@/types/metric";
import MetricCard from "./MetricCard";

interface Props {
    metrics: DashboardMetric[];
}

export default function MetricCards({ metrics }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
            ))}
        </div>
    );
}
