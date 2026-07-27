"use client";

import PlatformPageHeader from "./PlatformPageHeader";
import ApiPerformanceView from "./ApiPerformanceView";
import { useTikTokApiPerformance } from "@/hooks/useTikTokApiPerformance";

export default function TikTokDashboard() {
    const { data, loading, error, refetch } = useTikTokApiPerformance();

    return (
        <div className="space-y-6">
            <PlatformPageHeader name="TikTok" icon="/icons/tiktok.svg" description="แคมเปญโฆษณาบน TikTok Ads" />

            <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} />
        </div>
    );
}
