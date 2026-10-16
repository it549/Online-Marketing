"use client";

import { useState } from "react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSubTabs, { PLATFORM_TABS, PlatformTab, getInitialPlatformTab } from "./PlatformSubTabs";
import PlatformInsightsPanel from "./insights/PlatformInsightsPanel";
import InsightsAiPanel from "./insights/InsightsAiPanel";
import ApiPerformanceView from "./ApiPerformanceView";
import DashboardEmptyState from "./DashboardEmptyState";
import { useGoogleAdsApiPerformance } from "@/hooks/useGoogleAdsApiPerformance";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";

function getDefaultDateRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

export default function GoogleAdsDashboard() {
    const [tab, setTab] = useState<PlatformTab>(getInitialPlatformTab);
    const { data, loading, error, refetch } = useGoogleAdsApiPerformance();
    const { company } = useSelectedCompany();
    const platformEnabled = company ? company.platforms.includes("googleAds") : false;
    const [range] = useState(getDefaultDateRange);

    return (
        <div className="space-y-6">
            <PlatformPageHeader name="Google Ads" icon="/icons/google-ads.svg" description="แคมเปญโฆษณาบน Google Ads" />

            <PlatformSubTabs value={tab} onChange={setTab} tabs={PLATFORM_TABS} />

            {tab === "overview" && <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} connectHref="/api/integrations/google-ads/connect" />}
            {tab === "content" && (
                <DashboardEmptyState message="ยังไม่มี Content Analytics สำหรับ Google Ads" hint="ฟีเจอร์นี้กำลังจะมาเร็ว ๆ นี้" action={<span />} />
            )}
            {tab === "audience" && <PlatformInsightsPanel platform="googleAds" platformEnabled={platformEnabled} />}
            {tab === "ai" && (
                <InsightsAiPanel platform="googleAds" platformEnabled={platformEnabled} dateFrom={range.dateFrom} dateTo={range.dateTo} />
            )}
        </div>
    );
}
