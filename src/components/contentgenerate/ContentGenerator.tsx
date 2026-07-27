"use client";
import { useState } from "react";
import { PenLine } from "lucide-react";

const SERVICE_TYPES = [
    "งานก่อสร้างบ้านพักอาศัย",
    "งานปรับปรุงอาคาร",
    "งานตกแต่งภายใน",
    "งานระบบไฟฟ้า",
    "งานระบบดับเพลิง/แจ้งเหตุ",
    "งานรั้วคอนกรีต",
    "งานออกแบบและก่อสร้าง",
    "งานทาสีอาคาร",
];

const PLATFORMS = ["Facebook", "TikTok", "ทั้งคู่"];
const TONES = ["เป็นทางการ", "เป็นกันเอง", "กระตุ้นการตัดสินใจ"];

export default function ContentGenerator() {
    const [service, setService] = useState(SERVICE_TYPES[0]);
    const [platform, setPlatform] = useState("Facebook");
    const [tone, setTone] = useState("เป็นกันเอง");
    const [extra, setExtra] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        setLoading(true);
        setResult("");
        const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service, platform, tone, extra }),
        });
        const text = await res.text();
        let data: any = {};
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: text.slice(0, 200) };
        }
        setResult(data.content || data.error || "เกิดข้อผิดพลาด");
        setLoading(false);
    };

    const copy = () => navigator.clipboard.writeText(result);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                    <PenLine className="h-5 w-5 text-indigo-600" strokeWidth={2} />
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900">สร้าง Content</h1>
                    <p className="text-sm text-slate-500">ให้ AI ช่วยเขียนคอนเทนต์การตลาดสำหรับสินค้าเซฟตี้และงานก่อสร้าง</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div>
                        <label className="text-slate-500 text-sm mb-2 block">ประเภทงาน</label>
                        <select
                            value={service}
                            onChange={(e) => setService(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none"
                        >
                            {SERVICE_TYPES.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-slate-500 text-sm mb-2 block">Platform</label>
                            <div className="flex gap-2">
                                {PLATFORMS.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPlatform(p)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            platform === p
                                                ? "bg-indigo-600 text-white"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-slate-500 text-sm mb-2 block">Tone</label>
                            <div className="flex gap-2">
                                {TONES.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTone(t)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            tone === t
                                                ? "bg-purple-600 text-white"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-slate-500 text-sm mb-2 block">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                        <textarea
                            value={extra}
                            onChange={(e) => setExtra(e.target.value)}
                            placeholder="เช่น: โปรลด 15% เดือนนี้, งานอยู่แถวชลบุรี, ลูกค้าเป็นโรงงาน..."
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm resize-none placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={generate}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 rounded-lg font-semibold text-white shadow-sm transition"
                    >
                        {loading ? "⏳ กำลังสร้าง Content..." : "✨ สร้าง Content"}
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 text-sm mb-4">ผลลัพธ์</h3>

                    {result ? (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={copy}
                                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                >
                                    📋 Copy
                                </button>
                            </div>

                            <pre className="text-slate-700 text-sm whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <PenLine className="h-5 w-5" strokeWidth={2} />
                            </div>

                            <p className="max-w-xs text-sm text-slate-400">
                                กรอกประเภทงานหรือสินค้าทางด้านซ้าย แล้วกด &quot;สร้าง Content&quot; เพื่อให้ AI ช่วยร่างข้อความให้
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
