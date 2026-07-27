"use client";

import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DataSourceBadge from "../DataSourceBadge";
import MetricCards from "../MetricCards";
import DashboardTable from "../DashboardTable";
import DashboardEmptyState from "../DashboardEmptyState";
import ImportCsvButton from "../ImportCsvButton";
import ImportedFilesPanel from "../ImportedFilesPanel";
import { useFacebookContentAnalytics } from "@/hooks/useFacebookContentAnalytics";
import { IMPORT_CONFIG_BY_PLATFORM } from "@/constants/importConfig";
import { DashboardMetric } from "@/types/metric";
import { FacebookContentDashboardResponse } from "@/types/facebookContentDashboard";

const IMPORT_CONFIG = IMPORT_CONFIG_BY_PLATFORM.facebook_content;

export default function FacebookImportedAnalytics() {
    const { data, loading, error, importJobId, setImportJobId, refetch } = useFacebookContentAnalytics();

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <ImportCsvButton onImported={refetch} endpoint={IMPORT_CONFIG.endpoint} platforms={IMPORT_CONFIG.platforms} />
            </div>

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && data.hasData === false && (
                <DashboardEmptyState onImported={refetch} endpoint={IMPORT_CONFIG.endpoint} platforms={IMPORT_CONFIG.platforms} />
            )}

            {data && data.hasData && (
                <>
                    <DataSourceBadge
                        source="imported"
                        fileCount={data.importBatches.length}
                        latestImportedAt={data.importBatches[0]?.importedAt ?? null}
                    />

                    <ImportedFilesPanel batches={data.importBatches} selectedId={importJobId} onSelect={setImportJobId} />

                    <MetricCards metrics={buildMetrics(data)} />

                    <DashboardTable
                        title="โพสต์"
                        table={{
                            columns: [
                                { key: "name", label: "โพสต์" },
                                { key: "postType", label: "ประเภท", align: "center" },
                                { key: "reach", label: "Reach", align: "right" },
                                { key: "views", label: "ยอดดู", align: "right" },
                                { key: "engagement", label: "Engagement", align: "right" },
                            ],
                            rows: data.posts.map((post) => ({
                                id: post.id,
                                name: truncateTitle(post.title),
                                postType: post.postType,
                                reach: post.reach.toLocaleString(),
                                views: post.views.toLocaleString(),
                                engagement: post.engagement.toLocaleString(),
                            })),
                        }}
                    />

                    <DashboardTable
                        title="แยกตามประเภทโพสต์"
                        table={{
                            columns: [
                                { key: "name", label: "ประเภทโพสต์" },
                                { key: "postCount", label: "จำนวนโพสต์", align: "right" },
                                { key: "totalReach", label: "Reach รวม", align: "right" },
                                { key: "totalEngagement", label: "Engagement รวม", align: "right" },
                            ],
                            rows: data.breakdown.map((item) => ({
                                id: item.postType,
                                name: item.postType,
                                postCount: item.postCount.toLocaleString(),
                                totalReach: item.totalReach.toLocaleString(),
                                totalEngagement: item.totalEngagement.toLocaleString(),
                            })),
                        }}
                    />
                </>
            )}
        </div>
    );
}

function buildMetrics(data: FacebookContentDashboardResponse): DashboardMetric[] {
    return [
        { id: "reach", label: "Reach รวม", value: data.totalReach.toLocaleString(), subtitle: "การเข้าถึงทั้งหมด", color: "text-blue-600" },
        { id: "views", label: "ยอดดูรวม", value: data.totalViews.toLocaleString(), subtitle: "Views", color: "text-cyan-600" },
        { id: "engagement", label: "Engagement รวม", value: data.totalEngagement.toLocaleString(), subtitle: "ไลก์ + คอมเมนต์ + แชร์", color: "text-green-600" },
        { id: "posts", label: "จำนวนโพสต์", value: data.totalPosts.toLocaleString(), subtitle: "ทั้งหมด", color: "text-purple-600" },
    ];
}

function truncateTitle(title: string): string {
    const singleLine = title.replace(/\s+/g, " ").trim();
    return singleLine.length > 60 ? `${singleLine.slice(0, 60)}…` : singleLine;
}
