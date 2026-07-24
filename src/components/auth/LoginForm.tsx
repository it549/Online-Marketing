"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

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
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-700 bg-slate-800 p-8">
            <div>
                <h1 className="text-xl font-bold text-white">เข้าสู่ระบบ</h1>
                <p className="mt-1 text-sm text-slate-400">Rungsiyo Marketing Dashboard</p>
            </div>

            <div className="space-y-1">
                <label htmlFor="email" className="text-sm text-slate-300">
                    อีเมล หรือ ชื่อผู้ใช้
                </label>
                <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    autoComplete="username"
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="password" className="text-sm text-slate-300">
                    รหัสผ่าน
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    autoComplete="current-password"
                />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
        </form>
    );
}
