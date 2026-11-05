"use client";

import { useState } from "react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSubTabs, { PLATFORM_TABS, PlatformTab, getInitialPlatformTab } from "./PlatformSubTabs";
import PlatformInsightsPanel from "./insights/PlatformInsightsPanel";
import ShopeeApiPerformance from "./shopee/ShopeeApiPerformance";
import ShopeeImportedAnalytics from "./shopee/ShopeeImportedAnalytics";
import ShopeeAiInsights from "./shopee/ShopeeAiInsights";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";

export default function ShopeeDashboard() {
    const [tab, setTab] = useState<PlatformTab>(getInitialPlatformTab);
    const { company } = useSelectedCompany();
    const platformEnabled = company ? company.platforms.includes("shopee") : false;

    return (
        <div className="space-y-6">
            <PlatformPageHeader name="Shopee" icon="/icons/shopee.svg" description="ยอดขายและโฆษณาบนร้าน Shopee" />

            <PlatformSubTabs value={tab} onChange={setTab} tabs={PLATFORM_TABS} />

            {tab === "overview" && <ShopeeApiPerformance />}
            {tab === "content" && <ShopeeImportedAnalytics />}
            {tab === "audience" && <PlatformInsightsPanel platform="shopee" platformEnabled={platformEnabled} />}
            {tab === "ai" && <ShopeeAiInsights />}
        </div>
    );
}
