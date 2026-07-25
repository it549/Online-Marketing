"use client";
import { useState } from "react";

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
        <div className="space-y-6 max-w-3xl">
            <h2 className="text-lg font-semibold text-white">สร้าง Content อัตโนมัติ</h2>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
                <div>
                    <label className="text-slate-400 text-sm mb-2 block">ประเภทงาน</label>
                    <select
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm"
                    >
                        {SERVICE_TYPES.map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-400 text-sm mb-2 block">Platform</label>
                        <div className="flex gap-2">
                            {PLATFORMS.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        platform === p
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-slate-400 text-sm mb-2 block">Tone</label>
                        <div className="flex gap-2">
                            {TONES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                                        tone === t
                                            ? "bg-purple-600 text-white"
                                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-slate-400 text-sm mb-2 block">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
                    <textarea
                        value={extra}
                        onChange={(e) => setExtra(e.target.value)}
                        placeholder="เช่น: โปรลด 15% เดือนนี้, งานอยู่แถวชลบุรี, ลูกค้าเป็นโรงงาน..."
                        rows={2}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm resize-none placeholder-slate-500"
                    />
                </div>

                <button
                    onClick={generate}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
                >
                    {loading ? "⏳ กำลังสร้าง Content..." : "✨ สร้าง Content"}
                </button>
            </div>

            {result && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white text-sm">Content ที่สร้างได้</h3>
                        <button
                            onClick={copy}
                            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                        >
                            📋 Copy
                        </button>
                    </div>
                    <pre className="text-slate-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
                </div>
            )}
        </div>
    );
}
