import { TrendingUp } from "lucide-react";
import type { OverviewSignals } from "./overviewSignals";

const EXTRA_BUDGET_PCT = 0.2;

export default function OverviewOpportunity({ signals }: { signals: OverviewSignals }) {
    const c = signals.bestCampaign;
    if (!c || c.cpl <= 0) return null;

    const extraSpend = c.spend * EXTRA_BUDGET_PCT;
    const estimatedExtraLeads = extraSpend / c.cpl;

    return (
        <section>
            <h2 className="mb-1 text-lg font-bold text-slate-900">โอกาสที่น่าสนใจ</h2>
            <p className="mb-4 text-sm text-slate-500">แคมเปญที่ต้นทุนต่อลูกค้าต่ำที่สุดในบรรดาแคมเปญที่ได้ลูกค้าตอนนี้</p>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <TrendingUp size={14} />
                    เพิ่มงบให้แคมเปญ &quot;{c.name}&quot;
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                        <p className="text-xs text-slate-400">ต้นทุนต่อลูกค้าปัจจุบัน</p>
                        <p className="text-lg font-bold text-slate-900">฿{c.cpl.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">ลูกค้าที่ได้แล้ว</p>
                        <p className="text-lg font-bold text-slate-900">{c.leads.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">ถ้าเพิ่มงบ {(EXTRA_BUDGET_PCT * 100).toFixed(0)}%</p>
                        <p className="text-lg font-bold text-slate-900">+฿{Math.round(extraSpend).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">ลูกค้าที่อาจได้เพิ่ม</p>
                        <p className="text-lg font-bold text-emerald-700">+{Math.round(estimatedExtraLeads).toLocaleString()} คน</p>
                    </div>
                </div>

                <p className="mb-4 text-xs text-slate-400">
                    * ประมาณการโดยสมมติว่าต้นทุนต่อลูกค้าคงเดิมเมื่อเพิ่มงบ ตัวเลขจริงอาจแตกต่างกันไป
                </p>

                <button
                    onClick={() => window.location.assign("/?view=adplan")}
                    className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-medium text-emerald-700 transition hover:brightness-95"
                >
                    ไปที่เครื่องมือวางแผนโฆษณา
                </button>
            </div>
        </section>
    );
}
