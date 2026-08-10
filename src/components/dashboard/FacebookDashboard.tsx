"use client";

import { useState } from "react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSubTabs, { PLATFORM_TABS, PlatformTab, getInitialPlatformTab } from "./PlatformSubTabs";
import PlatformInsightsPanel from "./insights/PlatformInsightsPanel";
import FacebookAdsOverview from "./facebook/FacebookAdsOverview";
import FacebookImportedAnalytics from "./facebook/FacebookImportedAnalytics";
import FacebookAudienceInsights from "./facebook/FacebookAudienceInsights";
import FacebookAiInsights from "./facebook/FacebookAiInsights";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";

export default function FacebookDashboard() {
    const [tab, setTab] = useState<PlatformTab>(getInitialPlatformTab);
    const { company } = useSelectedCompany();
    const platformEnabled = company ? company.platforms.includes("facebook") : false;

    return (
        <div className="space-y-6">
            <PlatformPageHeader
                name="Facebook"
                icon="/icons/facebook.svg"
                description="ผลลัพธ์โฆษณาและผลลัพธ์คอนเทนต์บนเพจ ในหน้าเดียว"
            />

            <PlatformSubTabs value={tab} onChange={setTab} tabs={PLATFORM_TABS} />

            {tab === "overview" && <FacebookAdsOverview />}
            {tab === "content" && <FacebookImportedAnalytics />}
            {tab === "audience" && (
                <PlatformInsightsPanel
                    platform="facebook"
                    platformEnabled={platformEnabled}
                    renderAudience={(range) => <FacebookAudienceInsights dateFrom={range.dateFrom} dateTo={range.dateTo} />}
                />
            )}
            {tab === "ai" && <FacebookAiInsights />}
        </div>
    );
}
