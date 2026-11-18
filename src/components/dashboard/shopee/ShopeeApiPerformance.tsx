"use client";

import ApiPerformanceView from "../ApiPerformanceView";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";

export default function ShopeeApiPerformance({ month = "" }: { month?: string }) {
    const { data, loading, error, refetch } = useShopeeApiPerformance(month);

    return <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} />;
}
