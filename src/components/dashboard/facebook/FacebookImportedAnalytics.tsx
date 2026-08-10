"use client";

import { RefreshCw, RotateCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DataSourceBadge from "../DataSourceBadge";
import MetricCards from "../MetricCards";
import DashboardTable from "../DashboardTable";
import DashboardEmptyState from "../DashboardEmptyState";
import { useFacebookContentAnalytics } from "@/hooks/useFacebookContentAnalytics";
import { useFacebookContentSync } from "@/hooks/useFacebookContentSync";
import { DashboardMetric } from "@/types/metric";
import { FacebookContentDashboardResponse, FacebookPostAd } from "@/types/facebookContentDashboard";

export default function FacebookImportedAnalytics() {
    const { data, loading, error, refetch } = useFacebookContentAnalytics();
    const { sync, syncing, error: syncError } = useFacebookContentSync();

    async function handleSync() {
        const success = await sync();
        if (success) await refetch();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                    onClick={refetch}
                    disabled={loading || syncing}
                    title="โพสต์ที่มีโฆษณาถูกดึงมาจาก Facebook อัตโนมัติทุกครั้งที่ซิงค์โฆษณา ปุ่มนี้แค่โหลดข้อมูลล่าสุดจากฐานข้อมูลใหม่"
                    className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
                    รีเฟรช
                </button>

                <button
                    onClick={handleSync}
                    disabled={loading || syncing}
                    title="ซิงค์โพสต์และดึงข้อมูลโพสต์ล่าสุดจาก Facebook API แล้วอัปเดตตาราง"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RotateCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} strokeWidth={2} />
                    ซิงค์โพสต์
                </button>
            </div>

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}
            {syncError && <DashboardError message={syncError} />}

            {data && data.hasData === false && (
                <DashboardEmptyState
                    message="ยังไม่มีโพสต์ที่มีโฆษณา"
                    hint="โพสต์จะแสดงที่นี่โดยอัตโนมัติหลังจากซิงค์ข้อมูลโฆษณา Facebook ครั้งแรก"
                    action={<></>}
                />
            )}

            {data && data.hasData && (
                <>
                    <DataSourceBadge source="synced" hasSyncedBefore lastSyncedAt={null} />

                    <MetricCards metrics={buildMetrics(data)} />

                    <div className="space-y-2">
                        <DashboardTable
                            title="โพสต์ที่มีโฆษณา"
                            table={{
                                columns: [
                                    { key: "name", label: "โพสต์" },
                                    { key: "publishedAt", label: "วันที่โพสต์", align: "center" },
                                    { key: "campaign", label: "แคมเปญโฆษณา", align: "left" },
                                    { key: "adSpend", label: "ยอดใช้จ่ายโฆษณา", align: "right" },
                                    { key: "engagement", label: "Engagement", align: "right" },
                                ],
                                rows: data.posts.map((post) => ({
                                    id: post.id,
                                    name: truncateTitle(post.title),
                                    publishedAt: post.publishedAt
                                        ? new Date(post.publishedAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
                                        : "-",
                                    campaign: formatCampaignNames(post.advertisingAds),
                                    adSpend: post.advertisingAds.length > 0
                                        ? `฿${post.advertisingAds.reduce((sum, ad) => sum + ad.spend, 0).toLocaleString()}`
                                        : "-",
                                    engagement: post.engagement.toLocaleString(),
                                })),
                            }}
                        />

                        <p className="px-1 text-xs text-slate-400">
                            แสดงเฉพาะโพสต์ที่ผูกกับโฆษณา ดึงข้อมูลอัตโนมัติจากการซิงค์โฆษณา Facebook (ไม่รวมโพสต์ออร์แกนิกที่ไม่มีโฆษณา) —
                            Reach/ยอดดูของโพสต์ยังไม่รองรับในขณะนี้
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

function buildMetrics(data: FacebookContentDashboardResponse): DashboardMetric[] {
    return [
        { id: "posts", label: "จำนวนโพสต์", value: data.totalPosts.toLocaleString(), subtitle: "ที่มีโฆษณา", color: "text-purple-600" },
        { id: "reactions", label: "การกดใจรวม", value: data.totalReactions.toLocaleString(), subtitle: "Reactions", color: "text-pink-600" },
        { id: "engagement", label: "Engagement รวม", value: data.totalEngagement.toLocaleString(), subtitle: "กดใจ + คอมเมนต์ + แชร์", color: "text-green-600" },
    ];
}

function truncateTitle(title: string): string {
    const singleLine = title.replace(/\s+/g, " ").trim();
    return singleLine.length > 60 ? `${singleLine.slice(0, 60)}…` : singleLine;
}

function formatCampaignNames(ads: FacebookPostAd[]): string {
    if (ads.length === 0) return "ออร์แกนิก";
    if (ads.length === 1) return ads[0].campaignName;
    return `${ads[0].campaignName} +${ads.length - 1} แคมเปญ`;
}
