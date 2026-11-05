import { Star } from "lucide-react";
import type { AudienceBreakdownRow } from "@/types/insights";

const STATUS_STYLE = {
    good: { bg: "bg-emerald-50", text: "text-emerald-700", badge: "🟢" },
    mid: { bg: "bg-amber-50", text: "text-amber-700", badge: "🟡" },
    bad: { bg: "bg-rose-50", text: "text-rose-700", badge: "🔴" },
    none: { bg: "bg-slate-100", text: "text-slate-500", badge: "⚪" },
} as const;

type Status = keyof typeof STATUS_STYLE;

function isEmptyRow(row: AudienceBreakdownRow): boolean {
    return row.spend === 0 && row.impressions === 0 && row.clicks === 0 && row.conversions === 0;
}

interface CardInfo {
    row: AudienceBreakdownRow;
    stars: number;
    note: string;
    status: Status;
}

function buildCardInfo(rows: AudienceBreakdownRow[]): CardInfo[] {
    const withData = rows.filter((r) => !isEmptyRow(r));
    const maxConversions = Math.max(0, ...withData.map((r) => r.conversions));
    const minConversions = Math.min(...(withData.length > 0 ? withData.map((r) => r.conversions) : [0]));
    const cpaValues = withData.filter((r) => r.cpa !== null).map((r) => r.cpa as number);
    const maxCpa = cpaValues.length > 0 ? Math.max(...cpaValues) : null;

    return rows.map((row) => {
        if (isEmptyRow(row)) {
            return { row, stars: 0, note: "ยังไม่มีข้อมูลเพียงพอสำหรับกลุ่มนี้", status: "none" as Status };
        }

        const spread = maxConversions - minConversions;
        const stars = spread > 0 ? Math.max(1, Math.round(1 + ((row.conversions - minConversions) / spread) * 4)) : 3;

        if (row.spend > 0 && row.conversions === 0) {
            return { row, stars: 1, note: "ใช้งบไปแล้วแต่ยังไม่ได้ลูกค้าเลย", status: "bad" as Status };
        }

        if (row.conversions === maxConversions && maxConversions > 0) {
            return { row, stars: 5, note: "ได้ลูกค้าเยอะที่สุดในกลุ่มที่เปรียบเทียบ ควรพิจารณาเพิ่มงบ", status: "good" as Status };
        }

        if (maxCpa !== null && row.cpa === maxCpa) {
            return { row, stars: Math.min(stars, 2), note: "ต้นทุนต่อลูกค้าสูงกว่ากลุ่มอื่น", status: "bad" as Status };
        }

        if (stars >= 4) {
            return { row, stars, note: "ทำผลงานได้ดี", status: "good" as Status };
        }

        if (stars <= 2) {
            return { row, stars, note: "ทำผลงานได้น้อยกว่ากลุ่มอื่น", status: "mid" as Status };
        }

        return { row, stars, note: "ผลงานอยู่ในระดับปานกลาง", status: "mid" as Status };
    });
}

export default function AudienceStarCards({ rows }: { rows: AudienceBreakdownRow[] }) {
    const cards = buildCardInfo(rows);

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ row, stars, note, status }) => {
                const s = STATUS_STYLE[status];

                return (
                    <div key={row.dimensionValue} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{row.dimensionValue}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.bg} ${s.text}`}>{s.badge}</span>
                        </div>

                        <div className="mb-2 flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={15} className={i < stars ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                            ))}
                        </div>

                        <p className="text-sm text-slate-600">{note}</p>

                        <div className="mt-2 text-xs text-slate-400">
                            ใช้งบ ฿{row.spend.toLocaleString()} · ลูกค้า {row.conversions.toLocaleString()} คน
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
