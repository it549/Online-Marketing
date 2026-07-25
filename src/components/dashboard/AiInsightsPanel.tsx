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
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <h3 className="text-sm font-semibold text-white">วิเคราะห์ด้วย AI</h3>

                <p className="mt-1 text-xs text-slate-400">{description}</p>

                <button
                    onClick={generate}
                    disabled={loading}
                    className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? "กำลังวิเคราะห์..." : data ? "วิเคราะห์ใหม่" : "วิเคราะห์ด้วย AI"}
                </button>
            </div>

            {error && <div className="rounded-xl border border-red-700 bg-red-900/30 p-4 text-sm text-red-300">⚠️ {error}</div>}

            {data && (
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>วิเคราะห์จาก: {data.sources.map((source) => SOURCE_LABELS[source]).join(", ")}</span>
                        <span>· {new Date(data.generatedAt).toLocaleString("th-TH")}</span>
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{data.content}</div>
                </div>
            )}
        </div>
    );
}
