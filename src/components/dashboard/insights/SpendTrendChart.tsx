"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { SpendTrendPoint } from "@/types/insights";

const LINE_COLOR = "#4f46e5";
const CHART_HEIGHT = 200;
const LEFT_MARGIN = 52;
const RIGHT_MARGIN = 16;
const TOP_MARGIN = 16;
const BOTTOM_MARGIN = 28;
const TICK_COUNT = 4;

const MONTH_LABELS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `฿${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
    return `฿${Math.round(value).toLocaleString()}`;
}

function formatDateLabel(dateStr: string): string {
    const [, month, day] = dateStr.split("-").map(Number);
    return `${day} ${MONTH_LABELS[month - 1]}`;
}

function formatDateFull(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    return `${day} ${MONTH_LABELS[month - 1]} ${year + 543}`;
}

export default function SpendTrendChart({ points }: { points: SpendTrendPoint[] }) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    if (points.length === 0) {
        return null;
    }

    if (points.length === 1) {
        const only = points[0];

        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LINE_COLOR }} />
                    ยอดใช้จ่ายรายวัน
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    มีข้อมูล 1 วันในช่วงที่เลือก (ระบบซิงค์ข้อมูลใหม่วันละ 1 ครั้ง ข้อมูลจะค่อย ๆ เพิ่มขึ้นทุกวัน)
                </div>

                <div className="mt-4 flex items-end justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                        <p className="text-xs text-slate-400">{formatDateFull(only.date)}</p>
                        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">฿{Math.round(only.spend).toLocaleString()}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        <p>Impressions {only.impressions.toLocaleString()}</p>
                        <p>Clicks {only.clicks.toLocaleString()}</p>
                        <p>Conversions {only.conversions.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        );
    }

    const plotWidth = Math.max(points.length * 56, 360);
    const chartWidth = plotWidth + LEFT_MARGIN + RIGHT_MARGIN;
    const plotHeight = CHART_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
    const maxSpend = Math.max(1, ...points.map((point) => point.spend));

    function y(value: number): number {
        return TOP_MARGIN + plotHeight - (value / maxSpend) * plotHeight;
    }

    function x(index: number): number {
        return points.length > 1 ? LEFT_MARGIN + (index / (points.length - 1)) * plotWidth : LEFT_MARGIN + plotWidth / 2;
    }

    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.spend)}`).join(" ");
    const areaPath = `${linePath} L${x(points.length - 1)},${TOP_MARGIN + plotHeight} L${x(0)},${TOP_MARGIN + plotHeight} Z`;

    const yTicks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (maxSpend / TICK_COUNT) * i);
    const labelEvery = Math.max(1, Math.ceil(points.length / 7));
    const hovered = hoverIndex !== null ? points[hoverIndex] : null;
    const isSparse = points.length < 5;

    return (
        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LINE_COLOR }} />
                    ยอดใช้จ่ายรายวัน
                </div>

                {isSparse && (
                    <span className="flex items-center gap-1 text-[11px] text-indigo-600">
                        <Info className="h-3 w-3" strokeWidth={2} />
                        มีข้อมูล {points.length} วันในช่วงที่เลือก
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <svg width={chartWidth} height={CHART_HEIGHT} role="img" aria-label="กราฟยอดใช้จ่ายรายวัน">
                    {yTicks.map((tickValue, i) => {
                        const ty = y(tickValue);
                        return (
                            <g key={i}>
                                <line x1={LEFT_MARGIN} y1={ty} x2={chartWidth - RIGHT_MARGIN} y2={ty} stroke="#f1f5f9" strokeWidth={1} />
                                <text x={LEFT_MARGIN - 8} y={ty + 3} textAnchor="end" fontSize={10} fill="#94a3b8">
                                    {formatCompact(tickValue)}
                                </text>
                            </g>
                        );
                    })}

                    <path d={areaPath} fill={LINE_COLOR} fillOpacity={0.08} stroke="none" />
                    <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} />

                    {points.map((point, index) => (
                        <text
                            key={`label-${point.date}`}
                            x={x(index)}
                            y={CHART_HEIGHT - 6}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#94a3b8"
                        >
                            {index === 0 || index === points.length - 1 || index % labelEvery === 0 ? formatDateLabel(point.date) : ""}
                        </text>
                    ))}

                    {points.map((point, index) => (
                        <g key={point.date} onMouseEnter={() => setHoverIndex(index)} onMouseLeave={() => setHoverIndex(null)} style={{ cursor: "pointer" }}>
                            <circle cx={x(index)} cy={y(point.spend)} r={10} fill="transparent" />
                            <circle cx={x(index)} cy={y(point.spend)} r={hoverIndex === index ? 4.5 : 3} fill={LINE_COLOR} />
                        </g>
                    ))}

                    {hovered && hoverIndex !== null && (
                        <g style={{ pointerEvents: "none" }}>
                            <line x1={x(hoverIndex)} y1={TOP_MARGIN} x2={x(hoverIndex)} y2={TOP_MARGIN + plotHeight} stroke={LINE_COLOR} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />

                            {(() => {
                                const tooltipWidth = 128;
                                const rawX = x(hoverIndex) + 10;
                                const tooltipX = Math.min(rawX, chartWidth - tooltipWidth - 4);
                                const tooltipY = Math.max(y(hovered.spend) - 46, TOP_MARGIN);

                                return (
                                    <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                                        <rect width={tooltipWidth} height={40} rx={8} fill="#1e293b" />
                                        <text x={10} y={16} fontSize={10} fill="#cbd5e1">
                                            {formatDateLabel(hovered.date)}
                                        </text>
                                        <text x={10} y={31} fontSize={12} fontWeight={700} fill="#ffffff">
                                            ฿{Math.round(hovered.spend).toLocaleString()}
                                        </text>
                                    </g>
                                );
                            })()}
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}
