"use client";

import ApiPerformanceView from "../ApiPerformanceView";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";

export default function ShopeeApiPerformance() {
    const { data, loading, error } = useShopeeApiPerformance();

    return <ApiPerformanceView data={data} loading={loading} error={error} />;
}
