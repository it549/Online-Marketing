"use client";

import { useState } from "react";
import { Megaphone, Package, Wallet } from "lucide-react";
import PlatformPageHeader from "./PlatformPageHeader";
import PlatformSubTabs, { PLATFORM_TABS, PlatformTab, SubTabDef, getInitialPlatformTab } from "./PlatformSubTabs";
import PlatformInsightsPanel from "./insights/PlatformInsightsPanel";
import ShopeeApiPerformance from "./shopee/ShopeeApiPerformance";
import ShopeeImportedAnalytics from "./shopee/ShopeeImportedAnalytics";
import ShopeeAiInsights from "./shopee/ShopeeAiInsights";
import ShopeeProducts from "./shopee/ShopeeProducts";
import ShopeeAds from "./shopee/ShopeeAds";
import ShopeePayments from "./shopee/ShopeePayments";
import ShopeeMonthSelect from "./shopee/ShopeeMonthSelect";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";

type ShopeeTab = PlatformTab | "products" | "ads" | "payments";

// Shopee-only tabs after Overview: the whole product catalogue and every ad (any status).
const SHOPEE_TABS: SubTabDef<ShopeeTab>[] = [
    PLATFORM_TABS[0],
    { id: "products", label: "สินค้า", icon: Package },
    { id: "ads", label: "โฆษณา", icon: Megaphone },
    { id: "payments", label: "การเงิน", icon: Wallet },
    ...PLATFORM_TABS.slice(1),
];

function getInitialShopeeTab(): ShopeeTab {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
    if (requested === "products" || requested === "ads" || requested === "payments") return requested;
    return getInitialPlatformTab();
}

export default function ShopeeDashboard() {
    const [tab, setTab] = useState<ShopeeTab>(getInitialShopeeTab);
    const [month, setMonth] = useState("");
    const { company } = useSelectedCompany();
    const platformEnabled = company ? company.platforms.includes("shopee") : false;

    return (
        <div className="space-y-6">
            <PlatformPageHeader name="Shopee" icon="/icons/shopee.svg" description="ยอดขายและโฆษณาบนร้าน Shopee" />

            <PlatformSubTabs value={tab} onChange={setTab} tabs={SHOPEE_TABS} />

            {/* Overview, Ads and Payments share one Shopee request, so one month choice drives all three. */}
            {(tab === "overview" || tab === "ads" || tab === "payments") && <ShopeeMonthSelect value={month} onChange={setMonth} />}

            {tab === "overview" && <ShopeeApiPerformance month={month} />}
            {tab === "products" && <ShopeeProducts />}
            {tab === "ads" && <ShopeeAds month={month} />}
            {tab === "payments" && <ShopeePayments month={month} />}
            {tab === "content" && <ShopeeImportedAnalytics />}
            {tab === "audience" && <PlatformInsightsPanel platform="shopee" platformEnabled={platformEnabled} />}
            {tab === "ai" && <ShopeeAiInsights />}
        </div>
    );
}
