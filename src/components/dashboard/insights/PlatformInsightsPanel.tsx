"use client";

import { useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import InsightsDateRangePicker from "./InsightsDateRangePicker";
import InsightsSummaryHero from "./InsightsSummaryHero";
import InsightsKpiCards from "./InsightsKpiCards";
import InsightsTrendChart from "./InsightsTrendChart";
import AudienceBreakdownView from "./AudienceBreakdownView";
import LeadsView from "./LeadsView";
import { summarizeTrend } from "./trendSummary";
import { useSpendTrend } from "@/hooks/useSpendTrend";
import { useEtlSync } from "@/hooks/useEtlSync";
import type { CompanyPlatformId } from "@/types/company";
import type { BreakdownDimension } from "@/types/insights";

const PLATFORM_LABEL: Record<CompanyPlatformId, string> = {
    facebook: "Facebook",
    shopee: "Shopee",
    tiktok: "TikTok",
    googleAds: "Google Ads",
};

function getDefaultDateRange() {
    const to = new Date();
    const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

interface Props {
    platform: CompanyPlatformId;
    platformEnabled: boolean;
    /** Custom audience breakdown UI (e.g. Facebook's fixed 4-panel view). Defaults to the generic dimension-driven breakdown. */
    renderAudience?: (range: { dateFrom: string; dateTo: string }) => ReactNode;
}

/** Shared "Audience" tab content: date range + manual sync, spend/lead trend, audience breakdown, and lead list. Reused across all 4 platform dashboards -- this used to be the single global Insights page's body, scoped here to one fixed platform. */
export default function PlatformInsightsPanel({ platform, platformEnabled, renderAudience }: Props) {
    const [range, setRange] = useState(getDefaultDateRange);
    const [dimension, setDimension] = useState<BreakdownDimension>("AGE");
    const [syncNonce, setSyncNonce] = useState(0);
    const { data: trend, refetch: refetchTrend } = useSpendTrend(platform, range.dateFrom, range.dateTo);
    const { sync, syncing, error: syncError } = useEtlSync();

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
            <InsightsSummaryHero
                platformLabel={PLATFORM_LABEL[platform]}
                ready={trendReady}
                pointCount={trend?.points.length ?? 0}
                summary={trendSummary}
            />

            <div className="flex flex-wrap items-center justify-end gap-2">
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

            {syncError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">⚠️ {syncError}</div>}

            {trendReady && trendSummary && <InsightsKpiCards summary={trendSummary} />}

            {trendReady && trend && <InsightsTrendChart points={trend.points} />}

            {renderAudience ? (
                renderAudience(range)
            ) : (
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

            <LeadsView platform={platform} platformEnabled={platformEnabled} dateFrom={range.dateFrom} dateTo={range.dateTo} />
        </div>
    );
}
