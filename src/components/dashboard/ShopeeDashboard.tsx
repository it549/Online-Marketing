"use client";

import { useState } from "react";
import PlatformSubTabs, { PlatformSubTab } from "./PlatformSubTabs";
import ShopeeApiPerformance from "./shopee/ShopeeApiPerformance";
import ShopeeImportedAnalytics from "./shopee/ShopeeImportedAnalytics";
import ShopeeAiInsights from "./shopee/ShopeeAiInsights";

export default function ShopeeDashboard() {
    const [tab, setTab] = useState<PlatformSubTab>("imported");

    return (
        <div className="space-y-6">
            <PlatformSubTabs value={tab} onChange={setTab} />

            {tab === "api" && <ShopeeApiPerformance />}
            {tab === "imported" && <ShopeeImportedAnalytics />}
            {tab === "ai" && <ShopeeAiInsights />}
        </div>
    );
}
