"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Lock, User } from "lucide-react";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
                return;
            }

            router.push("/");
            router.refresh();
        } catch {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                    <Building2 className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-base font-bold leading-tight text-slate-900">Marketing Management</p>
                    <p className="text-xs text-slate-500">แพลตฟอร์มการตลาดสำหรับหลายบริษัท</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">เข้าสู่ระบบ</h1>
                    <p className="mt-1 text-sm text-slate-500">สำหรับผู้ดูแลระบบเท่านั้น</p>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        อีเมล หรือ ชื่อผู้ใช้
                    </label>
                    <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
                        <input
                            id="email"
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            autoComplete="username"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                        รหัสผ่าน
                    </label>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            autoComplete="current-password"
                        />
                    </div>
                </div>

                {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
                เข้าสู่ระบบเดียว ใช้จัดการข้อมูลได้ทุกบริษัทที่คุณดูแล
            </p>
        </div>
    );
}
