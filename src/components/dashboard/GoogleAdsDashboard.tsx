"use client";

import PlatformPageHeader from "./PlatformPageHeader";
import ApiPerformanceView from "./ApiPerformanceView";
import { useGoogleAdsApiPerformance } from "@/hooks/useGoogleAdsApiPerformance";

export default function GoogleAdsDashboard() {
    const { data, loading, error, refetch } = useGoogleAdsApiPerformance();

    return (
        <div className="space-y-6">
            <PlatformPageHeader name="Google Ads" icon="/icons/google-ads.svg" description="แคมเปญโฆษณาบน Google Ads" />

            <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} />
        </div>
    );
}
