"use client";

import ApiPerformanceView from "../ApiPerformanceView";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";

export default function ShopeeApiPerformance() {
    const { data, loading, error, refetch } = useShopeeApiPerformance();

    return <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} />;
}
