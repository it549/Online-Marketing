import { Wallet, Users, CircleDollarSign, Gauge, TrendingUp, TrendingDown } from "lucide-react";
import type { TrendSummary } from "./trendSummary";

interface KpiDef {
    icon: typeof Wallet;
    label: string;
    value: string;
    /** % change vs the earlier half of the range, or null when there isn't enough data to say. */
    changePct: number | null;
    /** For this metric, does a rise in changePct mean things got better? (cost-per-customer: a drop is good) */
    higherIsBetter: boolean;
}

function KpiCard({ icon: Icon, label, value, changePct, higherIsBetter }: KpiDef) {
    const isGood = changePct === null ? null : higherIsBetter ? changePct >= 0 : changePct <= 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Icon size={18} />
                <span className="text-xs text-slate-500">{label}</span>
            </div>

            <div className="text-2xl font-bold text-slate-900">{value}</div>

            {changePct !== null && Math.abs(changePct) >= 1 && (
                <div className={`mt-1 flex items-center gap-1 text-xs ${isGood ? "text-emerald-600" : "text-rose-600"}`}>
                    {changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(changePct).toFixed(0)}% เทียบช่วงก่อนหน้า
                </div>
            )}
        </div>
    );
}

export default function InsightsKpiCards({ summary }: { summary: TrendSummary }) {
    const conversionsChangePct = summary.hasEnoughDataForTrend ? summary.conversionsChangePct : null;
    const spendChangePct = summary.hasEnoughDataForTrend ? summary.spendChangePct : null;
    const costChangePct = summary.hasEnoughDataForTrend ? summary.costPerConversionChangePct : null;

    return (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={Wallet} label="ใช้งบทั้งหมด" value={`฿${Math.round(summary.totalSpend).toLocaleString()}`} changePct={spendChangePct} higherIsBetter={false} />

            <KpiCard icon={Users} label="ลูกค้าที่ได้" value={summary.totalConversions.toLocaleString()} changePct={conversionsChangePct} higherIsBetter />

            <KpiCard
                icon={CircleDollarSign}
                label="ค่าใช้จ่ายต่อ 1 ลูกค้า"
                value={summary.costPerConversion !== null ? `฿${summary.costPerConversion.toFixed(2)}` : "-"}
                changePct={costChangePct}
                higherIsBetter={false}
            />

            <KpiCard
                icon={Gauge}
                label="อัตราติดต่อสำเร็จ"
                value={summary.conversionRatePct !== null ? `${summary.conversionRatePct.toFixed(1)}%` : "-"}
                changePct={null}
                higherIsBetter
            />
        </section>
    );
}
