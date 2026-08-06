"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, PlugZap } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardEmptyState from "../DashboardEmptyState";
import DataSourceBadge from "../DataSourceBadge";
import AudienceThingsToDo from "./AudienceThingsToDo";
import AudienceBestWorst from "./AudienceBestWorst";
import AudienceStarCards from "./AudienceStarCards";
import AudienceBreakdownTable from "./AudienceBreakdownTable";
import { useAudienceBreakdown } from "@/hooks/useAudienceBreakdown";
import type { CompanyPlatformId } from "@/types/company";
import type { BreakdownDimension } from "@/types/insights";

const DIMENSIONS: { id: BreakdownDimension; label: string }[] = [
    { id: "AGE", label: "อายุ" },
    { id: "GENDER", label: "เพศ" },
    { id: "REGION", label: "ภูมิภาค" },
    { id: "PUBLISHER_PLATFORM", label: "แพลตฟอร์ม" },
    { id: "PLATFORM_POSITION", label: "ตำแหน่งโฆษณา" },
];

interface Props {
    platform: CompanyPlatformId;
    platformEnabled: boolean;
    dateFrom: string;
    dateTo: string;
    dimension: BreakdownDimension;
    onDimensionChange: (dimension: BreakdownDimension) => void;
    /** Bump this (e.g. after a manual ETL sync) to force a refetch without changing the query itself. */
    refreshToken?: number;
}

export default function AudienceBreakdownView({ platform, platformEnabled, dateFrom, dateTo, dimension, onDimensionChange, refreshToken }: Props) {
    const { data, loading, error } = useAudienceBreakdown(platform, dimension, dateFrom, dateTo, refreshToken);
    const [showDetail, setShowDetail] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);

    function scrollToDetail() {
        setShowDetail(true);
        requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-xs font-medium text-slate-400">แบ่งกลุ่มตาม</p>
                <div className="flex flex-wrap items-center gap-2">
                    {DIMENSIONS.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => onDimensionChange(d.id)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                dimension === d.id ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

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
                            message="ยังไม่มีข้อมูลซิงค์"
                            hint="ระบบจะซิงค์ข้อมูลอัตโนมัติทุกวัน กรุณากลับมาดูใหม่ภายหลัง"
                            action={<span />}
                        />
                    ) : !data.hasDataInRange ? (
                        <DashboardEmptyState
                            message="ไม่พบข้อมูลในช่วงวันที่เลือก"
                            hint="ลองปรับช่วงวันที่ดูใหม่"
                            action={<span />}
                        />
                    ) : (
                        <>
                            <AudienceThingsToDo rows={data.rows} onViewDetail={scrollToDetail} />

                            <AudienceBestWorst rows={data.rows} />

                            <div>
                                <h2 className="mb-1 text-lg font-bold text-slate-900">กลุ่มเป้าหมายทั้งหมด</h2>
                                <p className="mb-4 text-sm text-slate-500">ให้คะแนนดาวเทียบกันภายในกลุ่มที่เลือก</p>
                                <AudienceStarCards rows={data.rows} />
                            </div>

                            <div ref={detailRef}>
                                <button
                                    onClick={() => setShowDetail((v) => !v)}
                                    className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
                                >
                                    {showDetail ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    ดูข้อมูลรายละเอียดทั้งหมด
                                </button>

                                {showDetail && <AudienceBreakdownTable rows={data.rows} />}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
