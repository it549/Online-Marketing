"use client";

import { useSpendTrend } from "@/hooks/useSpendTrend";
import SpendTrendChart from "../insights/SpendTrendChart";

interface Props {
    dateFrom: string;
    dateTo: string;
}

export default function FacebookPerformanceTrend({ dateFrom, dateTo }: Props) {
    const { data } = useSpendTrend("facebook", dateFrom, dateTo);

    if (!data || !data.hasDataInRange || data.points.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Performance Trend</h3>
            <SpendTrendChart points={data.points} />
        </div>
    );
}
