"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Info, Trophy } from "lucide-react";
import type { AudienceBreakdownRow } from "@/types/insights";

type SortKey = "spend" | "impressions" | "clicks" | "ctr" | "conversions" | "cpa";
type SortDir = "asc" | "desc";

const BAR_COLOR: Record<"spend" | "impressions" | "clicks" | "conversions", string> = {
    spend: "#4f46e5",
    impressions: "#0891b2",
    clicks: "#7c3aed",
    conversions: "#059669",
};

const SORTABLE_COLUMNS: { key: SortKey; label: string; glossary?: string }[] = [
    { key: "spend", label: "ยอดใช้จ่าย" },
    { key: "impressions", label: "คนเห็นโฆษณา" },
    { key: "clicks", label: "คนคลิก" },
    { key: "ctr", label: "CTR", glossary: "อัตราการคลิก เทียบกับจำนวนคนที่เห็นโฆษณา ยิ่งสูงยิ่งดี" },
    { key: "conversions", label: "คนติดต่อ" },
    { key: "cpa", label: "CPA", glossary: "ค่าใช้จ่ายเฉลี่ยเพื่อให้ได้ลูกค้า 1 คน ยิ่งต่ำยิ่งดี" },
];

function isEmptyRow(row: AudienceBreakdownRow): boolean {
    return row.spend === 0 && row.impressions === 0 && row.clicks === 0 && row.conversions === 0;
}

/** Light pastel background for a value's rank between min/max — green (good) to red (poor). `invert` flips which end is "good" (e.g. CPA: lower is better). */
function heatStyle(value: number | null, min: number, max: number, invert: boolean): React.CSSProperties {
    if (value === null) return {};

    const ratio = max > min ? (value - min) / (max - min) : 0.5;
    const hue = (invert ? 1 - ratio : ratio) * 120;

    return { backgroundColor: `hsl(${hue}, 75%, 93%)` };
}

function MiniBarCell({ value, max, color, format }: { value: number; max: number; color: string; format: (v: number) => string }) {
    const widthPct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;

    return (
        <div className="min-w-[110px]">
            <div className="text-right text-sm font-medium text-slate-700">{format(value)}</div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function RankBadges({ isTopCtr, isTopCpa }: { isTopCtr: boolean; isTopCpa: boolean }) {
    if (!isTopCtr && !isTopCpa) return null;

    return (
        <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
            {isTopCtr && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600" title="CTR ดีที่สุด">
                    <Trophy className="h-2.5 w-2.5" strokeWidth={2.5} />
                    CTR
                </span>
            )}
            {isTopCpa && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600" title="CPA ดีที่สุด">
                    <Trophy className="h-2.5 w-2.5" strokeWidth={2.5} />
                    CPA
                </span>
            )}
        </span>
    );
}

export default function AudienceBreakdownTable({ rows }: { rows: AudienceBreakdownRow[] }) {
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [tip, setTip] = useState<string | null>(null);

    const { topCtrValue, topCpaValue, maxSpend, maxImpressions, maxClicks, maxConversions, ctrMin, ctrMax, cpaMin, cpaMax } = useMemo(() => {
        const ctrValues = rows.map((r) => r.ctr).filter((v): v is number => v !== null);
        const cpaValues = rows.map((r) => r.cpa).filter((v): v is number => v !== null);

        return {
            topCtrValue: ctrValues.length > 0 ? Math.max(...ctrValues) : null,
            topCpaValue: cpaValues.length > 0 ? Math.min(...cpaValues) : null,
            maxSpend: Math.max(0, ...rows.map((r) => r.spend)),
            maxImpressions: Math.max(0, ...rows.map((r) => r.impressions)),
            maxClicks: Math.max(0, ...rows.map((r) => r.clicks)),
            maxConversions: Math.max(0, ...rows.map((r) => r.conversions)),
            ctrMin: ctrValues.length > 0 ? Math.min(...ctrValues) : 0,
            ctrMax: ctrValues.length > 0 ? Math.max(...ctrValues) : 0,
            cpaMin: cpaValues.length > 0 ? Math.min(...cpaValues) : 0,
            cpaMax: cpaValues.length > 0 ? Math.max(...cpaValues) : 0,
        };
    }, [rows]);

    const sortedRows = useMemo(() => {
        if (!sortKey) return rows;

        const withValue = rows.map((row) => ({ row, value: row[sortKey] }));
        withValue.sort((a, b) => {
            const av = a.value ?? -Infinity;
            const bv = b.value ?? -Infinity;
            return sortDir === "asc" ? av - bv : bv - av;
        });

        return withValue.map((w) => w.row);
    }, [rows, sortKey, sortDir]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    }

    function SortIcon({ column }: { column: SortKey }) {
        if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 text-slate-300" strokeWidth={2} />;
        return sortDir === "desc" ? <ArrowDown className="h-3 w-3 text-indigo-600" strokeWidth={2.5} /> : <ArrowUp className="h-3 w-3 text-indigo-600" strokeWidth={2.5} />;
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">สรุปตามกลุ่มเป้าหมาย</h3>
            </div>

            {/* Desktop / tablet: full comparison table */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3 text-left">กลุ่ม</th>
                            {SORTABLE_COLUMNS.map((col) => (
                                <th key={col.key} className="px-5 py-3 text-right">
                                    <span className="inline-flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort(col.key)}
                                            className="inline-flex items-center gap-1 hover:text-slate-600"
                                        >
                                            {col.label}
                                            <SortIcon column={col.key} />
                                        </button>

                                        {col.glossary && (
                                            <span
                                                className="relative inline-flex"
                                                onMouseEnter={() => setTip(col.key)}
                                                onMouseLeave={() => setTip(null)}
                                            >
                                                <Info className="h-3 w-3 cursor-help text-slate-300" strokeWidth={2} />
                                                {tip === col.key && (
                                                    <span className="absolute right-0 top-5 z-10 w-48 rounded-lg bg-slate-800 px-3 py-2 text-left text-[11px] font-normal normal-case leading-relaxed text-white shadow-lg">
                                                        {col.glossary}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {sortedRows.map((row) => {
                            const empty = isEmptyRow(row);
                            const isTopCtr = row.ctr !== null && row.ctr === topCtrValue;
                            const isTopCpa = row.cpa !== null && row.cpa === topCpaValue;

                            return (
                                <tr key={row.dimensionValue} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${empty ? "opacity-40" : ""}`}>
                                    <td className="px-5 py-3 text-left font-medium text-slate-700">
                                        {row.dimensionValue}
                                        <RankBadges isTopCtr={isTopCtr} isTopCpa={isTopCpa} />
                                    </td>
                                    <td className="px-5 py-3">
                                        <MiniBarCell value={row.spend} max={maxSpend} color={BAR_COLOR.spend} format={(v) => `฿${v.toLocaleString()}`} />
                                    </td>
                                    <td className="px-5 py-3">
                                        <MiniBarCell value={row.impressions} max={maxImpressions} color={BAR_COLOR.impressions} format={(v) => v.toLocaleString()} />
                                    </td>
                                    <td className="px-5 py-3">
                                        <MiniBarCell value={row.clicks} max={maxClicks} color={BAR_COLOR.clicks} format={(v) => v.toLocaleString()} />
                                    </td>
                                    <td className="px-5 py-3 text-right" style={heatStyle(row.ctr, ctrMin, ctrMax, false)}>
                                        {row.ctr !== null ? `${row.ctr.toFixed(2)}%` : "-"}
                                    </td>
                                    <td className="px-5 py-3">
                                        <MiniBarCell value={row.conversions} max={maxConversions} color={BAR_COLOR.conversions} format={(v) => v.toLocaleString()} />
                                    </td>
                                    <td className="px-5 py-3 text-right" style={heatStyle(row.cpa, cpaMin, cpaMax, true)}>
                                        {row.cpa !== null ? `฿${row.cpa.toFixed(2)}` : "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile: one card per group, no horizontal scrolling required */}
            <div className="divide-y divide-slate-100 md:hidden">
                {sortedRows.map((row) => {
                    const empty = isEmptyRow(row);
                    const isTopCtr = row.ctr !== null && row.ctr === topCtrValue;
                    const isTopCpa = row.cpa !== null && row.cpa === topCpaValue;

                    return (
                        <div key={row.dimensionValue} className={`px-5 py-4 ${empty ? "opacity-40" : ""}`}>
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{row.dimensionValue}</span>
                                <RankBadges isTopCtr={isTopCtr} isTopCpa={isTopCpa} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-400">ยอดใช้จ่าย</p>
                                    <MiniBarCell value={row.spend} max={maxSpend} color={BAR_COLOR.spend} format={(v) => `฿${v.toLocaleString()}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Impressions</p>
                                    <MiniBarCell value={row.impressions} max={maxImpressions} color={BAR_COLOR.impressions} format={(v) => v.toLocaleString()} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Clicks</p>
                                    <MiniBarCell value={row.clicks} max={maxClicks} color={BAR_COLOR.clicks} format={(v) => v.toLocaleString()} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Conversions</p>
                                    <MiniBarCell value={row.conversions} max={maxConversions} color={BAR_COLOR.conversions} format={(v) => v.toLocaleString()} />
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <div className="flex-1 rounded-lg px-3 py-2 text-center" style={heatStyle(row.ctr, ctrMin, ctrMax, false)}>
                                    <p className="text-[10px] uppercase text-slate-500">CTR</p>
                                    <p className="text-sm font-semibold text-slate-800">{row.ctr !== null ? `${row.ctr.toFixed(2)}%` : "-"}</p>
                                </div>
                                <div className="flex-1 rounded-lg px-3 py-2 text-center" style={heatStyle(row.cpa, cpaMin, cpaMax, true)}>
                                    <p className="text-[10px] uppercase text-slate-500">CPA</p>
                                    <p className="text-sm font-semibold text-slate-800">{row.cpa !== null ? `฿${row.cpa.toFixed(2)}` : "-"}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
