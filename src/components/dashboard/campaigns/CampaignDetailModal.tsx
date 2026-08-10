"use client";

import { useCampaignDetail } from "@/hooks/useCampaignDetail";

interface Props {
    campaignId: string | null;
    onClose: () => void;
}

const TONE_CLASS: Record<string, string> = {
    positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    neutral: "bg-slate-100 text-slate-500 ring-slate-200",
    negative: "bg-red-50 text-red-600 ring-red-200",
};

export default function CampaignDetailModal({ campaignId, onClose }: Props) {
    const { data, loading, error } = useCampaignDetail(campaignId);

    if (!campaignId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{data?.campaignName ?? "รายละเอียดแคมเปญ"}</h3>
                        {data && (
                            <span
                                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[data.statusTone]}`}
                            >
                                {data.statusLabel}
                            </span>
                        )}
                    </div>

                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        ✕
                    </button>
                </div>

                {loading && <p className="py-8 text-center text-sm text-slate-400">กำลังโหลด...</p>}

                {error && <p className="text-sm text-red-600">⚠️ {error}</p>}

                {data && data.posts.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">ยังไม่มีโพสต์ที่โฆษณาแคมเปญนี้</p>
                )}

                {data && data.posts.length > 0 && (
                    <div className="space-y-3">
                        {data.posts.map((post) => (
                            <div key={post.postId} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="line-clamp-2 flex-1 text-sm text-slate-800">
                                        {post.message ?? "(โพสต์ไม่มีข้อความ)"}
                                    </p>

                                    {post.permalink && (
                                        <a
                                            href={post.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 text-xs font-medium text-indigo-600 hover:underline"
                                        >
                                            ดูโพสต์
                                        </a>
                                    )}
                                </div>

                                <p className="mt-1 text-xs text-slate-400">โฆษณาโดย {post.adName}</p>

                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div className="rounded-lg bg-white px-3 py-2 text-center">
                                        <p className="text-[11px] text-slate-400">ยอดใช้จ่าย</p>
                                        <p className="text-sm font-bold text-slate-900">฿{post.spend.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-white px-3 py-2 text-center">
                                        <p className="text-[11px] text-slate-400">Reach</p>
                                        <p className="text-sm font-bold text-slate-900">{post.reach.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg bg-white px-3 py-2 text-center">
                                        <p className="text-[11px] text-slate-400">Clicks</p>
                                        <p className="text-sm font-bold text-slate-900">{post.clicks.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
