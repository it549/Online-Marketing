"use client";

import { PlugZap } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardEmptyState from "../DashboardEmptyState";
import DataSourceBadge from "../DataSourceBadge";
import MetricCards from "../MetricCards";
import DashboardTable from "../DashboardTable";
import { useLeadsSummary } from "@/hooks/useLeadsSummary";
import type { CompanyPlatformId } from "@/types/company";
import type { DashboardMetric } from "@/types/metric";
import type { LeadsSummary } from "@/types/insights";

interface Props {
    platform: CompanyPlatformId;
    platformEnabled: boolean;
    dateFrom: string;
    dateTo: string;
}

export default function LeadsView({ platform, platformEnabled, dateFrom, dateTo }: Props) {
    const { data, loading, error } = useLeadsSummary(platform, dateFrom, dateTo);

    return (
        <div className="space-y-6">
            {!platformEnabled && (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                        <PlugZap className="h-7 w-7 text-amber-600" strokeWidth={2} />
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">ยังไม่ได้เปิดใช้งานแพลตฟอร์มนี้</h3>

                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">บริษัทนี้ยังไม่ได้เชื่อมต่อหรือเปิดใช้งานแพลตฟอร์มนี้</p>
                </div>
            )}

            {platformEnabled && loading && <DashboardLoading />}

            {platformEnabled && error && <DashboardError message={error} />}

            {platformEnabled && data && (
                <>
                    <DataSourceBadge source="synced" hasSyncedBefore={data.hasSyncedBefore} lastSyncedAt={data.lastSyncedAt} />

                    {!data.hasSyncedBefore ? (
                        <DashboardEmptyState
                            message="ยังไม่มีข้อมูล Lead"
                            hint="ระบบจะดึง Lead ใหม่อัตโนมัติทุกชั่วโมง กรุณากลับมาดูใหม่ภายหลัง"
                            action={<span />}
                        />
                    ) : !data.hasDataInRange ? (
                        <DashboardEmptyState message="ไม่พบ Lead ในช่วงวันที่เลือก" hint="ลองปรับช่วงวันที่ดูใหม่" action={<span />} />
                    ) : (
                        <>
                            <MetricCards metrics={buildMetrics(data.summary)} />

                            <DashboardTable
                                title="รายการ Lead"
                                table={{
                                    columns: [
                                        { key: "fullName", label: "ชื่อ" },
                                        { key: "email", label: "อีเมล" },
                                        { key: "phone", label: "เบอร์โทร" },
                                        { key: "source", label: "แหล่งที่มา" },
                                        { key: "status", label: "สถานะ", align: "center" },
                                        { key: "createdAtExternal", label: "วันที่", align: "right" },
                                    ],
                                    rows: data.leads.map((lead) => ({
                                        id: lead.id,
                                        fullName: lead.fullName ?? "-",
                                        email: lead.email ?? "-",
                                        phone: lead.phone ?? "-",
                                        source: lead.source,
                                        status: lead.status ?? "-",
                                        createdAtExternal: lead.createdAtExternal
                                            ? new Date(lead.createdAtExternal).toLocaleDateString("th-TH")
                                            : "-",
                                    })),
                                }}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function buildMetrics(summary: LeadsSummary): DashboardMetric[] {
    return [
        { id: "total", label: "Lead ทั้งหมด", value: summary.total.toLocaleString(), color: "text-indigo-600" },
        ...summary.byStatus.map((s) => ({
            id: `status-${s.status}`,
            label: `สถานะ: ${s.status}`,
            value: s.count.toLocaleString(),
            color: "text-slate-600",
        })),
    ];
}
