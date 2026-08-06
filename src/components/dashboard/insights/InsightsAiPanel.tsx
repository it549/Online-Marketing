"use client";

import { PlugZap } from "lucide-react";
import AiInsightsPanel from "../AiInsightsPanel";
import type { CompanyPlatformId } from "@/types/company";

interface Props {
    platform: CompanyPlatformId;
    platformEnabled: boolean;
    dateFrom: string;
    dateTo: string;
}

export default function InsightsAiPanel({ platform, platformEnabled, dateFrom, dateTo }: Props) {
    if (!platformEnabled) {
        return (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                    <PlugZap className="h-7 w-7 text-amber-600" strokeWidth={2} />
                </div>

                <h3 className="text-base font-semibold text-slate-900">ยังไม่ได้เปิดใช้งานแพลตฟอร์มนี้</h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">บริษัทนี้ยังไม่ได้เชื่อมต่อหรือเปิดใช้งานแพลตฟอร์มนี้</p>
            </div>
        );
    }

    const params = new URLSearchParams({ platform, dateFrom, dateTo });

    return (
        <AiInsightsPanel
            endpoint={`/api/dashboard/insights/ai-recommendation?${params.toString()}`}
            description="วิเคราะห์ผลลัพธ์แยกตามกลุ่มเป้าหมายและ Lead ในช่วงวันที่เลือก เพื่อแนะนำแนวทางแคมเปญที่เหมาะกับลูกค้าของคุณมากที่สุด"
        />
    );
}
