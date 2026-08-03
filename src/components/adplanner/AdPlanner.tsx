"use client";
import { useState } from "react";
import { Target } from "lucide-react";

export default function AdPlanner() {
    const [budget, setBudget] = useState("");
    const [goal, setGoal] = useState("หา leads ลูกค้าใหม่");
    const [area, setArea] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const GOALS = ["หา leads ลูกค้าใหม่", "สร้าง brand awareness", "โปรโมทโปรลดราคา", "หาลูกค้าภาครัฐ"];

    const plan = async () => {
        setLoading(true);
        setResult("");
        const res = await fetch("/api/adplan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ budget, goal, area }),
        });
        const data = await res.json();
        setResult(data.plan || data.error || "เกิดข้อผิดพลาด");
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <Target className="h-5 w-5 text-indigo-600" strokeWidth={2} />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900">วางแผนโฆษณา</h1>
                    <p className="text-sm text-slate-500">กรอกงบประมาณและเป้าหมาย เพื่อให้ AI แนะนำแผนการตลาดที่เหมาะสม</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-500 text-sm mb-2 block">งบโฆษณา/เดือน (บาท)</label>
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="เช่น: 10000"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-sm mb-2 block">พื้นที่เป้าหมาย</label>
                            <input
                                type="text"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                placeholder="เช่น: ชลบุรี, ระยอง, กรุงเทพฯ"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-slate-500 text-sm mb-2 block">เป้าหมายโฆษณา</label>
                        <div className="grid grid-cols-2 gap-2">
                            {GOALS.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGoal(g)}
                                    className={`py-2.5 px-4 rounded-lg text-sm text-left transition-colors ${
                                        goal === g
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={plan}
                        disabled={loading || !budget}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 rounded-lg font-semibold text-white shadow-sm transition-colors"
                    >
                        {loading ? "⏳ กำลังวางแผน..." : "🎯 สร้างแผนโฆษณา"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 text-sm mb-4">แผนที่แนะนำ</h3>

                    {result ? (
                        <pre className="text-slate-700 text-sm whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Target className="h-5 w-5" strokeWidth={2} />
                            </div>

                            <p className="max-w-xs text-sm text-slate-400">
                                กรอกงบประมาณ เป้าหมาย และพื้นที่ทางด้านซ้าย แล้วกด &quot;สร้างแผนโฆษณา&quot; เพื่อรับคำแนะนำจาก AI
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
