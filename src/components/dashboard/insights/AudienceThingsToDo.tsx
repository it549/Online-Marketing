import type { AudienceBreakdownRow } from "@/types/insights";

function isEmptyRow(row: AudienceBreakdownRow): boolean {
    return row.spend === 0 && row.impressions === 0 && row.clicks === 0 && row.conversions === 0;
}

interface ActionCard {
    dot: string;
    title: string;
    reasons: string[];
    ctaLabel: string;
    onClick: () => void;
}

const CARD_STYLE = {
    good: { dot: "bg-emerald-500", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700" },
    bad: { dot: "bg-rose-500", border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
    warn: { dot: "bg-amber-500", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
} as const;

interface Props {
    rows: AudienceBreakdownRow[];
    onViewDetail: () => void;
}

export default function AudienceThingsToDo({ rows, onViewDetail }: Props) {
    const withData = rows.filter((r) => !isEmptyRow(r));
    if (withData.length < 2) return null;

    const byConversionsDesc = [...withData].sort((a, b) => b.conversions - a.conversions);
    const best = byConversionsDesc[0];

    const zeroConversionButSpent = withData.find((r) => r.spend > 0 && r.conversions === 0);
    const cpaValues = withData.filter((r) => r.cpa !== null).map((r) => r.cpa as number);
    const maxCpa = cpaValues.length > 0 ? Math.max(...cpaValues) : null;
    const worstByCpa = maxCpa !== null ? withData.find((r) => r.cpa === maxCpa) : null;

    const ctrValues = withData.filter((r) => r.ctr !== null).map((r) => r.ctr as number);
    const minCtr = ctrValues.length > 0 ? Math.min(...ctrValues) : null;
    const lowCtrGroup = minCtr !== null && ctrValues.length > 1 ? withData.find((r) => r.ctr === minCtr) : null;

    const cards: (ActionCard & { style: keyof typeof CARD_STYLE })[] = [];

    if (best.conversions > 0) {
        cards.push({
            style: "good",
            dot: "🟢",
            title: `เพิ่มงบให้กลุ่ม "${best.dimensionValue}"`,
            reasons: [
                `ได้ลูกค้ามากที่สุด (${best.conversions.toLocaleString()} คน)`,
                best.cpa !== null ? `ต้นทุนต่อลูกค้า ฿${best.cpa.toFixed(2)}` : "ผลงานดีกว่ากลุ่มอื่น",
            ],
            ctaLabel: "ไปที่เครื่องมือวางแผนโฆษณา",
            onClick: () => window.location.assign("/?view=adplan"),
        });
    }

    const reviewTarget = zeroConversionButSpent ?? worstByCpa;
    if (reviewTarget && reviewTarget.dimensionValue !== best.dimensionValue) {
        cards.push({
            style: "bad",
            dot: "🔴",
            title: `ทบทวนกลุ่ม "${reviewTarget.dimensionValue}"`,
            reasons:
                reviewTarget === zeroConversionButSpent
                    ? [`ใช้งบไป ฿${reviewTarget.spend.toLocaleString()} แต่ยังไม่ได้ลูกค้าเลย`]
                    : [`ต้นทุนต่อลูกค้าสูงที่สุด (฿${(reviewTarget.cpa ?? 0).toFixed(2)})`],
            ctaLabel: "ดูรายละเอียด",
            onClick: onViewDetail,
        });
    }

    if (lowCtrGroup && lowCtrGroup.dimensionValue !== best.dimensionValue && lowCtrGroup.dimensionValue !== reviewTarget?.dimensionValue) {
        cards.push({
            style: "warn",
            dot: "🟡",
            title: `ลองปรับเนื้อหาสำหรับกลุ่ม "${lowCtrGroup.dimensionValue}"`,
            reasons: [`คนคลิกน้อยกว่ากลุ่มอื่น (${(lowCtrGroup.ctr ?? 0).toFixed(2)}%)`],
            ctaLabel: "สร้าง Content ใหม่",
            onClick: () => window.location.assign("/?view=content"),
        });
    }

    if (cards.length === 0) return null;

    return (
        <section>
            <h2 className="mb-1 text-lg font-bold text-slate-900">สิ่งที่ควรทำวันนี้</h2>

            <div className="grid gap-4 sm:grid-cols-3">
                {cards.map((c) => {
                    const s = CARD_STYLE[c.style];

                    return (
                        <div key={c.title} className={`flex flex-col rounded-2xl border ${s.border} ${s.bg} p-4`}>
                            <div className="mb-2 flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                                <span className="font-semibold text-slate-900">{c.title}</span>
                            </div>

                            <ul className="mb-4 flex-1 space-y-1 text-xs text-slate-600">
                                {c.reasons.map((r) => (
                                    <li key={r}>• {r}</li>
                                ))}
                            </ul>

                            <button
                                onClick={c.onClick}
                                className={`rounded-full border ${s.border} ${s.text} bg-white px-3 py-2 text-xs font-medium transition hover:brightness-95`}
                            >
                                {c.ctaLabel}
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
