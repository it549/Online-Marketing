"use client";

import { useAiInsights } from "@/hooks/useAiInsights";
import { AiInsightsSource } from "@/types/aiInsights";

const SOURCE_LABELS: Record<AiInsightsSource, string> = {
    api: "API Performance",
    imported: "Imported Analytics",
};

interface Props {
    endpoint: string;
    description: string;
}

export default function AiInsightsPanel({ endpoint, description }: Props) {
    const { data, loading, error, generate } = useAiInsights(endpoint);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">วิเคราะห์ด้วย AI</h3>

                <p className="mt-1 text-xs text-slate-500">{description}</p>

                <button
                    onClick={generate}
                    disabled={loading}
                    className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? "⏳ กำลังวิเคราะห์..." : data ? "วิเคราะห์ใหม่" : "✨ วิเคราะห์ด้วย AI"}
                </button>
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">⚠️ {error}</div>}

            {data && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>วิเคราะห์จาก: {data.sources.map((source) => SOURCE_LABELS[source]).join(", ")}</span>
                        <span>· {new Date(data.generatedAt).toLocaleString("th-TH")}</span>
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.content}</div>
                </div>
            )}
        </div>
    );
}
