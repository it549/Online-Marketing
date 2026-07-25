"use client";

import { useState } from "react";
import PlatformSubTabs, { PlatformSubTab } from "./PlatformSubTabs";
import FacebookApiPerformance from "./facebook/FacebookApiPerformance";
import FacebookImportedAnalytics from "./facebook/FacebookImportedAnalytics";
import FacebookAiInsights from "./facebook/FacebookAiInsights";

export default function FacebookDashboard() {
    const [tab, setTab] = useState<PlatformSubTab>("api");

    return (
        <div className="space-y-6">
            <PlatformSubTabs value={tab} onChange={setTab} />

            {tab === "api" && <FacebookApiPerformance />}
            {tab === "imported" && <FacebookImportedAnalytics />}
            {tab === "ai" && <FacebookAiInsights />}
        </div>
    );
}
