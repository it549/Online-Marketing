"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import type { SpendTrendPoint } from "@/types/insights";
import { summarizeTrend } from "./trendSummary";

const LINE_COLOR = "#4f46e5";
const MONTH_LABELS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatDateLabel(dateStr: string): string {
    const [, month, day] = dateStr.split("-").map(Number);
    return `${day} ${MONTH_LABELS[month - 1]}`;
}

function formatDateFull(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    return `${day} ${MONTH_LABELS[month - 1]} ${year + 543}`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { rawDate: string; customers: number; spend: number } }[] }) {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload;

    return (
        <div className="rounded-lg border border-slate-200 bg-slate-800 px-3 py-2 text-xs text-white shadow-lg">
            <p className="text-slate-300">{formatDateLabel(point.rawDate)}</p>
            <p className="mt-0.5 font-semibold">ลูกค้าที่ได้ {point.customers.toLocaleString()} คน</p>
            <p className="text-slate-300">ใช้งบ ฿{Math.round(point.spend).toLocaleString()}</p>
        </div>
    );
}

export default function InsightsTrendChart({ points }: { points: SpendTrendPoint[] }) {
    if (points.length === 0) {
        return null;
    }

    if (points.length === 1) {
        const only = points[0];

        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-700">แนวโน้มลูกค้าที่ได้</h3>

                <div className="mb-4 flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    มีข้อมูล 1 วันในช่วงที่เลือก ระบบจะสรุปแนวโน้มให้เมื่อมีข้อมูลมากขึ้น
                </div>

                <div className="flex items-end justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                        <p className="text-xs text-slate-400">{formatDateFull(only.date)}</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{only.conversions.toLocaleString()} คน</p>
                    </div>
                    <p className="text-xs text-slate-500">ใช้งบ ฿{Math.round(only.spend).toLocaleString()}</p>
                </div>
            </div>
        );
    }

    const summary = summarizeTrend(points);
    const chartData = points.map((p) => ({ rawDate: p.date, label: formatDateLabel(p.date), customers: p.conversions, spend: p.spend }));

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">แนวโน้มลูกค้าที่ได้ (ช่วงที่เลือก)</h3>

            {summary.hasEnoughDataForTrend ? (
                <p
                    className={`mb-4 flex items-center gap-1.5 text-sm font-medium ${
                        summary.direction === "up" ? "text-emerald-700" : summary.direction === "down" ? "text-rose-700" : "text-slate-500"
                    }`}
                >
                    {summary.direction === "down" ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
                    {summary.direction === "flat"
                        ? "จำนวนลูกค้าที่ได้ค่อนข้างทรงตัวเทียบกับช่วงก่อนหน้า"
                        : `ลูกค้าที่ได้${summary.direction === "up" ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(summary.conversionsChangePct ?? 0).toFixed(0)}% เทียบกับช่วงก่อนหน้าของช่วงที่เลือก`}
                </p>
            ) : (
                <p className="mb-4 text-xs text-slate-400">มีข้อมูล {points.length} วัน — ยังไม่พอสรุปแนวโน้มเทียบช่วงก่อนหน้า</p>
            )}

            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="insightsTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.22} />
                                <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#eef0f5" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="customers" stroke={LINE_COLOR} strokeWidth={2} fill="url(#insightsTrendFill)" dot={{ r: 3, fill: LINE_COLOR }} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
