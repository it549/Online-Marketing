import { AlertTriangle, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { TrendSummary } from "./trendSummary";

interface Props {
    platformLabel: string;
    ready: boolean; // platform connected/enabled and has synced data at all
    pointCount: number;
    summary: TrendSummary | null;
}

const TONE = {
    up: { bg: "from-emerald-50 to-white", border: "border-emerald-100", chip: "border-emerald-200 text-emerald-700", icon: TrendingUp, iconColor: "text-emerald-600" },
    down: { bg: "from-rose-50 to-white", border: "border-rose-100", chip: "border-rose-200 text-rose-700", icon: TrendingDown, iconColor: "text-rose-600" },
    flat: { bg: "from-slate-50 to-white", border: "border-slate-200", chip: "border-slate-200 text-slate-600", icon: Sparkles, iconColor: "text-slate-500" },
} as const;

function Chip({ text, tone }: { text: string; tone: "up" | "down" | "flat" }) {
    const t = TONE[tone];
    const Icon = t.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs font-medium ${t.chip}`}>
            <Icon size={14} />
            {text}
        </span>
    );
}

export default function InsightsSummaryHero({ platformLabel, ready, pointCount, summary }: Props) {
    if (!ready || !summary) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7">
                <div className="mb-2 text-xs font-medium text-slate-500">สรุปภาพรวม · {platformLabel}</div>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">ยังไม่มีข้อมูลให้สรุป</h1>
                <p className="text-sm text-slate-500">เชื่อมต่อแพลตฟอร์มนี้และรอระบบซิงค์ข้อมูล หรือกด &quot;ซิงค์ตอนนี้&quot; แล้วกลับมาดูใหม่</p>
            </div>
        );
    }

    if (!summary.hasEnoughDataForTrend) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-7">
                <div className="mb-2 text-xs font-medium text-slate-500">สรุปภาพรวม · {platformLabel}</div>
                <h1 className="mb-3 text-2xl font-bold text-slate-900">มีข้อมูล {pointCount} วันในช่วงที่เลือก</h1>
                <p className="mb-4 text-sm text-slate-500">ยังไม่พอจะสรุปแนวโน้ม แต่นี่คือภาพรวมเท่าที่มีตอนนี้</p>
                <div className="flex flex-wrap gap-3">
                    <Chip text={`ใช้งบไป ฿${Math.round(summary.totalSpend).toLocaleString()}`} tone="flat" />
                    <Chip text={`ได้ลูกค้า ${summary.totalConversions.toLocaleString()} คน`} tone="flat" />
                </div>
            </div>
        );
    }

    const direction = summary.direction ?? "flat";
    const tone = TONE[direction];
    const Icon = tone.icon;
    const changePct = summary.conversionsChangePct ?? 0;

    const headline =
        direction === "up"
            ? "วันนี้โฆษณาทำผลงานได้ดี"
            : direction === "down"
              ? "ต้องดูแลใกล้ชิดขึ้น"
              : "ผลงานช่วงนี้ค่อนข้างทรงตัว";

    return (
        <div className={`rounded-3xl border ${tone.border} bg-gradient-to-br ${tone.bg} p-7`}>
            <div className="mb-2 text-xs font-medium text-slate-500">สรุปภาพรวม · {platformLabel}</div>

            <h1 className="mb-3 flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                {headline}
                <Icon className={tone.iconColor} size={26} />
            </h1>

            <div className="flex flex-wrap gap-3">
                <Chip
                    text={
                        direction === "flat"
                            ? "ลูกค้าที่ได้ใกล้เคียงกับช่วงก่อนหน้า"
                            : `ลูกค้าที่ได้${direction === "up" ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(changePct).toFixed(0)}% จากช่วงก่อนหน้า`
                    }
                    tone={direction}
                />

                {summary.costPerConversionChangePct !== null && Math.abs(summary.costPerConversionChangePct) > 5 && (
                    <Chip
                        text={`ต้นทุนต่อลูกค้า${summary.costPerConversionChangePct < 0 ? "ลดลง" : "เพิ่มขึ้น"} ${Math.abs(summary.costPerConversionChangePct).toFixed(0)}%`}
                        tone={summary.costPerConversionChangePct < 0 ? "up" : "down"}
                    />
                )}

                {direction === "down" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle size={14} />
                        แนะนำให้ดูช่วง &quot;วันนี้ควรทำอะไร&quot; ด้านล่าง
                    </span>
                )}
            </div>
        </div>
    );
}
