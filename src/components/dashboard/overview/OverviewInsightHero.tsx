import { AlertTriangle, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { TrendSummary } from "../insights/trendSummary";
import type { OverviewSignals } from "./overviewSignals";

type Health = "good" | "warn" | "bad";

const HEALTH_STYLE: Record<Health, { dot: string; border: string; bg: string; label: string; icon: typeof TrendingUp }> = {
    good: { dot: "🟢", border: "border-emerald-100", bg: "from-emerald-50 to-white", label: "ภาพรวมธุรกิจ: ดี", icon: TrendingUp },
    warn: { dot: "🟡", border: "border-amber-100", bg: "from-amber-50 to-white", label: "ภาพรวมธุรกิจ: ทรงตัว มีเรื่องต้องดูแล", icon: Sparkles },
    bad: { dot: "🔴", border: "border-rose-100", bg: "from-rose-50 to-white", label: "ภาพรวมธุรกิจ: ควรดูแลใกล้ชิด", icon: TrendingDown },
};

interface Props {
    hasSyncedBefore: boolean;
    pointCount: number;
    summary: TrendSummary | null;
    signals: OverviewSignals;
}

export default function OverviewInsightHero({ hasSyncedBefore, pointCount, summary, signals }: Props) {
    if (!hasSyncedBefore || !summary) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7">
                <div className="mb-2 text-xs font-medium text-slate-500">สรุปภาพรวมธุรกิจ</div>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">ยังไม่มีข้อมูลให้สรุป</h1>
                <p className="text-sm text-slate-500">เชื่อมต่อแพลตฟอร์มและรอระบบซิงค์ข้อมูล หรือกด &quot;ซิงค์ตอนนี้&quot; ในหน้าอินไซต์ แล้วกลับมาดูใหม่</p>
            </div>
        );
    }

    const hasUrgentIssue = signals.zeroLeadCampaign !== null || signals.noLeadsDespiteSpend;

    if (!summary.hasEnoughDataForTrend) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7">
                <div className="mb-2 text-xs font-medium text-slate-500">สรุปภาพรวมธุรกิจ</div>
                <h1 className="mb-3 text-2xl font-bold text-slate-900">มีข้อมูล {pointCount} วันในช่วงที่เลือก</h1>
                <p className="text-sm text-slate-500">
                    ใช้งบไปทั้งหมด ฿{Math.round(summary.totalSpend).toLocaleString()} ได้ลูกค้า {summary.totalConversions.toLocaleString()} คน — ยังมีข้อมูลไม่พอจะสรุปแนวโน้ม
                    ลองเลือกช่วงวันที่ยาวขึ้น
                </p>
            </div>
        );
    }

    const direction = summary.direction ?? "flat";
    const health: Health = direction === "down" || signals.noLeadsDespiteSpend ? "bad" : direction === "up" && !hasUrgentIssue ? "good" : "warn";
    const style = HEALTH_STYLE[health];
    const Icon = style.icon;
    const changePct = Math.abs(summary.conversionsChangePct ?? 0);

    const sentences: string[] = [];

    sentences.push(
        direction === "flat"
            ? `ช่วงที่เลือกได้ลูกค้า ${summary.totalConversions.toLocaleString()} คน ใกล้เคียงกับช่วงก่อนหน้า`
            : `ช่วงที่เลือกได้ลูกค้า${direction === "up" ? "เพิ่มขึ้น" : "ลดลง"} ${changePct.toFixed(0)}% จากช่วงก่อนหน้า (รวม ${summary.totalConversions.toLocaleString()} คน)`,
    );

    if (summary.costPerConversionChangePct !== null && Math.abs(summary.costPerConversionChangePct) > 5) {
        sentences.push(
            `ต้นทุนต่อลูกค้า${summary.costPerConversionChangePct < 0 ? "ลดลง" : "เพิ่มขึ้น"} ${Math.abs(summary.costPerConversionChangePct).toFixed(0)}% เทียบช่วงก่อนหน้า`,
        );
    }

    if (signals.bestPlatform && signals.worstPlatform) {
        sentences.push(
            `${signals.bestPlatform.name} ทำ ROAS ได้ดีกว่า ${signals.worstPlatform.name} ค่อนข้างมาก (${signals.bestPlatform.roas?.toFixed(1)}x เทียบ ${signals.worstPlatform.roas?.toFixed(1)}x)`,
        );
    }

    if (signals.noLeadsDespiteSpend) {
        sentences.push("ใช้งบไปแล้วในช่วงนี้แต่ยังไม่มีลูกค้าเข้ามาเลย ควรตรวจสอบด่วน");
    } else if (signals.zeroLeadCampaign) {
        sentences.push(`แคมเปญ "${signals.zeroLeadCampaign.name}" ใช้งบไป ฿${signals.zeroLeadCampaign.spend.toLocaleString()} แล้วแต่ยังไม่ได้ลูกค้าเลย`);
    }

    return (
        <div className={`rounded-3xl border ${style.border} bg-gradient-to-br ${style.bg} p-7`}>
            <div className="mb-2 text-xs font-medium text-slate-500">สรุปภาพรวมธุรกิจ</div>

            <h1 className="mb-3 flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                <span>{style.dot}</span>
                {style.label}
                <Icon className="text-slate-400" size={22} />
            </h1>

            <ul className="space-y-1.5 text-sm text-slate-700">
                {sentences.map((s) => (
                    <li key={s} className="flex gap-2">
                        <span className="text-slate-300">•</span>
                        {s}
                    </li>
                ))}
            </ul>

            {health !== "good" && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700">
                    <AlertTriangle size={14} />
                    ดูรายละเอียดที่ &quot;สิ่งที่ควรทำวันนี้&quot; ด้านล่าง
                </div>
            )}
        </div>
    );
}
