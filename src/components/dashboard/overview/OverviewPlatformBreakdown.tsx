import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { OverviewPlatformSummary } from "@/types/overview";

interface Props {
    platforms: OverviewPlatformSummary[];
}

const BAR_COLOR: Record<string, string> = {
    facebook: "bg-blue-600",
    shopee: "bg-orange-500",
    tiktok: "bg-teal-600",
    googleAds: "bg-amber-500",
};

export default function OverviewPlatformBreakdown({ platforms }: Props) {
    const totalSpend = platforms.reduce((sum, p) => sum + p.spend, 0);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">สัดส่วนตามแพลตฟอร์ม</h3>
            <p className="mt-1 text-xs text-slate-400">แบ่งตามค่าโฆษณา</p>

            {totalSpend > 0 && (
                <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    {platforms
                        .filter((p) => p.spend > 0)
                        .map((p) => (
                            <div key={p.id} className={BAR_COLOR[p.id]} style={{ width: `${(p.spend / totalSpend) * 100}%` }} />
                        ))}
                </div>
            )}

            <div className="mt-5 space-y-3">
                {platforms.map((platform) => {
                    const pct = totalSpend > 0 ? (platform.spend / totalSpend) * 100 : 0;

                    return (
                        <div key={platform.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                                <Image src={platform.icon} alt={platform.name} width={20} height={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900">{platform.name}</span>
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                            platform.sourceType === "api" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                        }`}
                                    >
                                        {platform.sourceType === "api" ? "API" : "CSV"}
                                    </span>
                                </div>

                                <p className="mt-0.5 text-xs text-slate-400">
                                    {platform.hasData ? (
                                        <>
                                            ฿{platform.spend.toLocaleString()} · {pct.toFixed(1)}%
                                        </>
                                    ) : (
                                        platform.statusLabel
                                    )}
                                </p>
                            </div>

                            <div className="shrink-0 text-right text-sm font-semibold text-slate-700">
                                {platform.roas !== null ? `ROAS ${platform.roas.toFixed(1)}x` : "-"}
                            </div>

                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
