"use client";

import ApiPerformanceView from "../ApiPerformanceView";
import { useFacebookApiPerformance } from "@/hooks/useFacebookApiPerformance";

export default function FacebookApiPerformance() {
    const { data, loading, error, refetch } = useFacebookApiPerformance();

    return <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} />;
}
