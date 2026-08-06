import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { AudienceBreakdownRow } from "@/types/insights";

function isEmptyRow(row: AudienceBreakdownRow): boolean {
    return row.spend === 0 && row.impressions === 0 && row.clicks === 0 && row.conversions === 0;
}

function buildReasons(row: AudienceBreakdownRow, rows: AudienceBreakdownRow[], kind: "best" | "worst"): string[] {
    const withData = rows.filter((r) => !isEmptyRow(r));
    const ctrValues = withData.filter((r) => r.ctr !== null).map((r) => r.ctr as number);
    const cpaValues = withData.filter((r) => r.cpa !== null).map((r) => r.cpa as number);
    const maxCtr = ctrValues.length > 0 ? Math.max(...ctrValues) : null;
    const minCpa = cpaValues.length > 0 ? Math.min(...cpaValues) : null;
    const maxCpa = cpaValues.length > 0 ? Math.max(...cpaValues) : null;
    const maxConversions = Math.max(0, ...withData.map((r) => r.conversions));

    const reasons: string[] = [];

    if (kind === "best") {
        if (row.conversions === maxConversions && maxConversions > 0) reasons.push(`ได้ลูกค้ามากที่สุด (${row.conversions.toLocaleString()} คน)`);
        if (row.ctr !== null && row.ctr === maxCtr) reasons.push(`อัตราคนคลิกดีที่สุด (${row.ctr.toFixed(2)}%)`);
        if (row.cpa !== null && row.cpa === minCpa) reasons.push(`ต้นทุนต่อลูกค้าต่ำที่สุด (฿${row.cpa.toFixed(2)})`);
    } else {
        if (row.spend > 0 && row.conversions === 0) reasons.push("ใช้งบไปแล้วแต่ยังไม่ได้ลูกค้าเลย");
        if (row.cpa !== null && row.cpa === maxCpa) reasons.push(`ต้นทุนต่อลูกค้าสูงที่สุด (฿${row.cpa.toFixed(2)})`);
        if (row.ctr !== null && maxCtr !== null && row.ctr < maxCtr) reasons.push(`อัตราคนคลิกต่ำกว่ากลุ่มอื่น (${row.ctr.toFixed(2)}%)`);
    }

    return reasons.length > 0 ? reasons : ["ข้อมูลยังมีไม่มากพอจะสรุปเหตุผลเพิ่มเติม"];
}

interface HighlightProps {
    title: string;
    row: AudienceBreakdownRow | null;
    kind: "best" | "worst";
    reasons: string[];
}

function Highlight({ title, row, kind, reasons }: HighlightProps) {
    const good = kind === "best";
    const border = good ? "border-emerald-100" : "border-rose-100";
    const bg = good ? "bg-emerald-50" : "bg-rose-50";
    const text = good ? "text-emerald-700" : "text-rose-700";
    const Icon = good ? CheckCircle2 : AlertTriangle;

    return (
        <div className={`rounded-2xl border ${border} ${bg} p-5`}>
            <div className={`mb-3 flex items-center gap-2 text-xs font-medium ${text}`}>
                <Icon size={14} />
                <span>{title}</span>
            </div>

            {row ? (
                <>
                    <div className="mb-2 text-xl font-bold text-slate-900">{row.dimensionValue}</div>
                    <ul className="space-y-1 text-sm text-slate-600">
                        {reasons.map((r) => (
                            <li key={r}>• {r}</li>
                        ))}
                    </ul>
                </>
            ) : (
                <p className="text-sm text-slate-500">ยังไม่มีข้อมูลเพียงพอ</p>
            )}
        </div>
    );
}

export default function AudienceBestWorst({ rows }: { rows: AudienceBreakdownRow[] }) {
    const withData = rows.filter((r) => !isEmptyRow(r));

    if (withData.length < 2) {
        return null;
    }

    const best = [...withData].sort((a, b) => b.conversions - a.conversions)[0];
    const worst = [...withData].sort((a, b) => {
        // "worst" = spent but got nothing, otherwise highest cost-per-customer, otherwise fewest customers
        const aBad = a.spend > 0 && a.conversions === 0;
        const bBad = b.spend > 0 && b.conversions === 0;
        if (aBad !== bBad) return aBad ? -1 : 1;
        if (a.cpa !== null && b.cpa !== null) return b.cpa - a.cpa;
        return a.conversions - b.conversions;
    })[0];

    return (
        <section className="grid gap-4 sm:grid-cols-2">
            <Highlight title="กลุ่มที่ทำผลงานดีที่สุด" row={best} kind="best" reasons={buildReasons(best, rows, "best")} />
            <Highlight title="กลุ่มที่ควรทบทวน" row={worst?.dimensionValue !== best?.dimensionValue ? worst : null} kind="worst" reasons={worst ? buildReasons(worst, rows, "worst") : []} />
        </section>
    );
}
