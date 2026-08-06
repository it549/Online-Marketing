"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Sparkles, Target, Users } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import PlatformSubTabs, { SubTabDef } from "../PlatformSubTabs";
import InsightsDateRangePicker from "./InsightsDateRangePicker";
import InsightsSummaryHero from "./InsightsSummaryHero";
import InsightsKpiCards from "./InsightsKpiCards";
import InsightsTrendChart from "./InsightsTrendChart";
import AudienceBreakdownView from "./AudienceBreakdownView";
import LeadsView from "./LeadsView";
import InsightsAiPanel from "./InsightsAiPanel";
import { summarizeTrend } from "./trendSummary";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";
import { useSpendTrend } from "@/hooks/useSpendTrend";
import { useEtlSync } from "@/hooks/useEtlSync";
import type { CompanyPlatformId } from "@/types/company";
import type { BreakdownDimension } from "@/types/insights";

type InsightsSubTab = "breakdown" | "leads" | "ai";

const SUB_TABS: SubTabDef<InsightsSubTab>[] = [
    { id: "breakdown", label: "กลุ่มเป้าหมาย", icon: Users },
    { id: "leads", label: "Lead", icon: Target },
    { id: "ai", label: "คำแนะนำ AI", icon: Sparkles },
];

const PLATFORM_LABEL: Record<CompanyPlatformId, string> = {
    facebook: "Facebook",
    shopee: "Shopee",
    tiktok: "TikTok",
    googleAds: "Google Ads",
};

const VALID_PLATFORMS: CompanyPlatformId[] = ["facebook", "shopee", "tiktok", "googleAds"];
const VALID_TABS: InsightsSubTab[] = ["breakdown", "leads", "ai"];
const VALID_DIMENSIONS: BreakdownDimension[] = ["AGE", "GENDER", "REGION", "PUBLISHER_PLATFORM", "PLATFORM_POSITION"];

function getDefaultDateRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

export default function InsightsPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <InsightsPageInner />
        </Suspense>
    );
}

function InsightsPageInner() {
    const { company, loading: companyLoading } = useSelectedCompany();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [platform, setPlatform] = useState<CompanyPlatformId>(() => {
        const fromUrl = searchParams.get("platform") as CompanyPlatformId | null;
        return fromUrl && VALID_PLATFORMS.includes(fromUrl) ? fromUrl : "facebook";
    });
    const [activeTab, setActiveTab] = useState<InsightsSubTab>(() => {
        const fromUrl = searchParams.get("tab") as InsightsSubTab | null;
        return fromUrl && VALID_TABS.includes(fromUrl) ? fromUrl : "breakdown";
    });
    const [dimension, setDimension] = useState<BreakdownDimension>(() => {
        const fromUrl = searchParams.get("dimension") as BreakdownDimension | null;
        return fromUrl && VALID_DIMENSIONS.includes(fromUrl) ? fromUrl : "AGE";
    });
    const [range, setRange] = useState(() => {
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        return dateFrom && dateTo ? { dateFrom, dateTo } : getDefaultDateRange();
    });

    // Company loads asynchronously after mount, so the platform picked from the URL (or the
    // "facebook" default) may not actually be enabled for it. Correcting that is a plain state
    // adjustment during render (React's documented pattern for this), not a side effect -- an
    // effect would commit the invalid platform for one extra frame before correcting it.
    const [correctedForCompanyId, setCorrectedForCompanyId] = useState<string | null>(null);
    if (company && company.id !== correctedForCompanyId) {
        setCorrectedForCompanyId(company.id);
        if (company.platforms.length > 0 && !company.platforms.includes(platform)) {
            setPlatform(company.platforms[0]);
        }
    }

    // Single effect keeps the URL in sync with state -- the one legitimate use of useEffect
    // here, since router.replace touches an external system (browser history), not React state.
    useEffect(() => {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("platform", platform);
        params.set("tab", activeTab);
        params.set("dimension", dimension);
        params.set("dateFrom", range.dateFrom);
        params.set("dateTo", range.dateTo);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [platform, activeTab, dimension, range.dateFrom, range.dateTo]);

    const { data: trend, refetch: refetchTrend } = useSpendTrend(platform, range.dateFrom, range.dateTo);
    const { sync, syncing, error: syncError } = useEtlSync();
    const [syncNonce, setSyncNonce] = useState(0);
    const platformEnabled = company ? company.platforms.includes(platform) : false;
    const availablePlatforms = company?.platforms ?? [];

    const trendReady = platformEnabled && !!trend?.hasDataInRange;
    const trendSummary = trendReady && trend ? summarizeTrend(trend.points) : null;

    async function handleSyncNow() {
        const ok = await sync(platform);
        if (ok) {
            refetchTrend();
            setSyncNonce((n) => n + 1);
        }
    }

    return (
        <div className="space-y-6">
            {companyLoading ? (
                <DashboardLoading />
            ) : (
                <>
                    <InsightsSummaryHero
                        platformLabel={PLATFORM_LABEL[platform]}
                        ready={trendReady}
                        pointCount={trend?.points.length ?? 0}
                        summary={trendSummary}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            {availablePlatforms.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p)}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                        platform === p ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    {PLATFORM_LABEL[p]}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <InsightsDateRangePicker dateFrom={range.dateFrom} dateTo={range.dateTo} onChange={setRange} />

                            <button
                                onClick={handleSyncNow}
                                disabled={!platformEnabled || syncing}
                                title="ดึงข้อมูลล่าสุดจาก API ของแพลตฟอร์มนี้ทันที (วันนี้ + เมื่อวาน) แทนที่จะรอรอบซิงค์อัตโนมัติตอนตี 3"
                                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={2} />
                                {syncing ? "กำลังซิงค์..." : "ซิงค์ตอนนี้"}
                            </button>
                        </div>
                    </div>

                    {syncError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">⚠️ {syncError}</div>}

                    {trendReady && trendSummary && <InsightsKpiCards summary={trendSummary} />}

                    {trendReady && trend && <InsightsTrendChart points={trend.points} />}

                    <PlatformSubTabs value={activeTab} onChange={setActiveTab} tabs={SUB_TABS} />

                    {activeTab === "breakdown" && (
                        <AudienceBreakdownView
                            platform={platform}
                            platformEnabled={platformEnabled}
                            dateFrom={range.dateFrom}
                            dateTo={range.dateTo}
                            dimension={dimension}
                            onDimensionChange={setDimension}
                            refreshToken={syncNonce}
                        />
                    )}

                    {activeTab === "leads" && (
                        <LeadsView platform={platform} platformEnabled={platformEnabled} dateFrom={range.dateFrom} dateTo={range.dateTo} />
                    )}

                    {activeTab === "ai" && (
                        <InsightsAiPanel platform={platform} platformEnabled={platformEnabled} dateFrom={range.dateFrom} dateTo={range.dateTo} />
                    )}
                </>
            )}
        </div>
    );
}
