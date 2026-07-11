"use client";
import { useState } from "react";

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
        <div className="space-y-6 max-w-3xl">
            <h2 className="text-lg font-semibold text-white">วางแผนโฆษณา</h2>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-400 text-sm mb-2 block">งบโฆษณา/เดือน (บาท)</label>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="เช่น: 10000"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500"
                        />
                    </div>
                    <div>
                        <label className="text-slate-400 text-sm mb-2 block">พื้นที่เป้าหมาย</label>
                        <input
                            type="text"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="เช่น: ชลบุรี, ระยอง, กรุงเทพฯ"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-slate-400 text-sm mb-2 block">เป้าหมายโฆษณา</label>
                    <div className="grid grid-cols-2 gap-2">
                        {GOALS.map((g) => (
                            <button
                                key={g}
                                onClick={() => setGoal(g)}
                                className={`py-2.5 px-4 rounded-lg text-sm text-left transition-colors ${
                                    goal === g
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
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
                    className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
                >
                    {loading ? "⏳ กำลังวางแผน..." : "🎯 สร้างแผนโฆษณา"}
                </button>
            </div>

            {result && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="font-semibold text-white text-sm mb-4">แผนโฆษณาที่แนะนำ</h3>
                    <pre className="text-slate-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
                </div>
            )}
        </div>
    );
}
