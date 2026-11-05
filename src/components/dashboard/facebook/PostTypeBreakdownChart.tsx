import { FacebookContentTypeBreakdown } from "@/types/facebookContentDashboard";

interface Props {
    breakdown: FacebookContentTypeBreakdown[];
}

export default function PostTypeBreakdownChart({ breakdown }: Props) {
    if (breakdown.length === 0) return null;

    const max = Math.max(...breakdown.map((item) => item.totalReach), 1);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Reach แยกตามประเภทโพสต์</h3>
            <p className="mt-0.5 text-xs text-slate-400">เรียงจากประเภทที่เข้าถึงคนมากที่สุด — ช่วยดูว่าควรลงเนื้อหาแบบไหนเพิ่ม</p>

            <div className="mt-5 space-y-4">
                {breakdown.map((item) => {
                    const width = Math.max((item.totalReach / max) * 100, 3);

                    return (
                        <div key={item.postType} className="grid grid-cols-[minmax(0,6.5rem)_1fr_auto] items-center gap-3">
                            <span className="truncate text-sm text-slate-600" title={item.postType}>
                                {item.postType}
                            </span>

                            <div className="h-5 rounded-full bg-slate-100">
                                <div className="h-5 rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold tabular-nums text-slate-900">{item.totalReach.toLocaleString()}</p>
                                <p className="text-[11px] text-slate-400">{item.postCount.toLocaleString()} โพสต์</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
