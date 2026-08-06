import type { OverviewSignals } from "./overviewSignals";

interface ActionCard {
    key: string;
    dot: string;
    title: string;
    reasons: string[];
    ctaLabel: string;
    onClick: () => void;
}

const CARD_STYLE = {
    bad: { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
    warn: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
} as const;

function buildCards(signals: OverviewSignals): (ActionCard & { style: keyof typeof CARD_STYLE })[] {
    const cards: (ActionCard & { style: keyof typeof CARD_STYLE })[] = [];

    if (signals.noLeadsDespiteSpend) {
        cards.push({
            key: "no-leads",
            style: "bad",
            dot: "🔴",
            title: "ยังไม่มีลูกค้าเข้ามาเลยในช่วงนี้",
            reasons: ["ใช้งบโฆษณาไปแล้วแต่ยังไม่มีลูกค้าติดต่อเข้ามา ควรตรวจสอบว่าโฆษณายังทำงานปกติหรือไม่"],
            ctaLabel: "ดูข้อมูล Lead",
            onClick: () => window.location.assign("/?view=insights&tab=leads"),
        });
    }

    if (signals.zeroLeadCampaign) {
        const c = signals.zeroLeadCampaign;
        cards.push({
            key: "zero-lead-campaign",
            style: "bad",
            dot: "🔴",
            title: `ทบทวนแคมเปญ "${c.name}"`,
            reasons: [`ใช้งบไป ฿${c.spend.toLocaleString()} แล้วแต่ยังไม่ได้ลูกค้าเลย`],
            ctaLabel: "ดูแคมเปญ",
            onClick: () => window.location.assign("/?view=campaigns"),
        });
    }

    if (signals.highCplCampaign && signals.avgCpl !== null) {
        const c = signals.highCplCampaign;
        cards.push({
            key: "high-cpl-campaign",
            style: "warn",
            dot: "🟡",
            title: `ต้นทุนต่อลูกค้าสูงในแคมเปญ "${c.name}"`,
            reasons: [`฿${c.cpl.toLocaleString()} ต่อลูกค้า สูงกว่าค่าเฉลี่ย (฿${signals.avgCpl.toFixed(0)}) ของแคมเปญที่ได้ลูกค้าทั้งหมด`],
            ctaLabel: "ดูแคมเปญ",
            onClick: () => window.location.assign("/?view=campaigns"),
        });
    }

    if (signals.bestPlatform && signals.worstPlatform) {
        cards.push({
            key: "platform-gap",
            style: "warn",
            dot: "🟡",
            title: `พิจารณาย้ายงบจาก ${signals.worstPlatform.name} ไป ${signals.bestPlatform.name}`,
            reasons: [`${signals.bestPlatform.name} ทำ ROAS ${signals.bestPlatform.roas?.toFixed(1)}x ดีกว่า ${signals.worstPlatform.name} ที่ทำได้ ${signals.worstPlatform.roas?.toFixed(1)}x`],
            ctaLabel: "เปรียบเทียบแพลตฟอร์ม",
            onClick: () => window.location.assign("/?view=insights"),
        });
    }

    return cards.slice(0, 3);
}

export default function OverviewPriorityActions({ signals }: { signals: OverviewSignals }) {
    const cards = buildCards(signals);
    if (cards.length === 0) return null;

    return (
        <section>
            <h2 className="mb-1 text-lg font-bold text-slate-900">สิ่งที่ควรทำวันนี้</h2>
            <p className="mb-4 text-sm text-slate-500">สรุปจากข้อมูลจริงในระบบ พร้อมเหตุผลสั้น ๆ และลิงก์ไปดูรายละเอียดได้เลย</p>

            <div className="grid gap-4 sm:grid-cols-3">
                {cards.map((c) => {
                    const s = CARD_STYLE[c.style];

                    return (
                        <div key={c.key} className={`flex flex-col rounded-2xl border ${s.border} ${s.bg} p-4`}>
                            <div className="mb-2 flex items-center gap-2">
                                <span>{c.dot}</span>
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
