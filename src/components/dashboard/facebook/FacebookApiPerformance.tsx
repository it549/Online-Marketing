"use client";

import ApiPerformanceView from "../ApiPerformanceView";
import { useFacebookApiPerformance } from "@/hooks/useFacebookApiPerformance";

export default function FacebookApiPerformance() {
    const { data, loading, error } = useFacebookApiPerformance();

    return <ApiPerformanceView data={data} loading={loading} error={error} />;
}
