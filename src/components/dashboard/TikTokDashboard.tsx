"use client";

import { useState } from "react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSubTabs, { PLATFORM_TABS, PlatformTab, getInitialPlatformTab } from "./PlatformSubTabs";
import PlatformInsightsPanel from "./insights/PlatformInsightsPanel";
import InsightsAiPanel from "./insights/InsightsAiPanel";
import ApiPerformanceView from "./ApiPerformanceView";
import DashboardEmptyState from "./DashboardEmptyState";
import { useTikTokApiPerformance } from "@/hooks/useTikTokApiPerformance";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";

function getDefaultDateRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

export default function TikTokDashboard() {
    const [tab, setTab] = useState<PlatformTab>(getInitialPlatformTab);
    const { data, loading, error, refetch } = useTikTokApiPerformance();
    const { company } = useSelectedCompany();
    const platformEnabled = company ? company.platforms.includes("tiktok") : false;
    const [range] = useState(getDefaultDateRange);

    return (
        <div className="space-y-6">
            <PlatformPageHeader name="TikTok" icon="/icons/tiktok.svg" description="แคมเปญโฆษณาบน TikTok Ads" />

            <PlatformSubTabs value={tab} onChange={setTab} tabs={PLATFORM_TABS} />

            {tab === "overview" && <ApiPerformanceView data={data} loading={loading} error={error} refetch={refetch} />}
            {tab === "content" && (
                <DashboardEmptyState message="ยังไม่มี Content Analytics สำหรับ TikTok" hint="ฟีเจอร์นี้กำลังจะมาเร็ว ๆ นี้" action={<span />} />
            )}
            {tab === "audience" && <PlatformInsightsPanel platform="tiktok" platformEnabled={platformEnabled} />}
            {tab === "ai" && (
                <InsightsAiPanel platform="tiktok" platformEnabled={platformEnabled} dateFrom={range.dateFrom} dateTo={range.dateTo} />
            )}
        </div>
    );
}
