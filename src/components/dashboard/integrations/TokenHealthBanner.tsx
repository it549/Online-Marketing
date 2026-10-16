"use client";

import { AlertTriangle } from "lucide-react";
import { useTokenHealth } from "@/hooks/useTokenHealth";

const ATTENTION_STATUSES = new Set(["expired", "invalid", "expiring"]);

/** Shown above every view so an expiring/dead token is noticed before the ETL quietly stops. */
export default function TokenHealthBanner({ onOpenIntegrations }: { onOpenIntegrations: () => void }) {
    const alerts = useTokenHealth().filter((token) => ATTENTION_STATUSES.has(token.status));
    if (!alerts.length) return null;

    const critical = alerts.some((token) => token.status !== "expiring");

    return (
        <div
            className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                critical ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
        >
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" strokeWidth={2} />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">{critical ? "การเชื่อมต่อบางรายการใช้งานไม่ได้ — ข้อมูลจะไม่ sync" : "Token ใกล้หมดอายุ"}</p>
                <ul className="mt-1 space-y-0.5">
                    {alerts.map((token) => (
                        <li key={token.label}>{token.message}</li>
                    ))}
                </ul>
            </div>
            <button onClick={onOpenIntegrations} className="shrink-0 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-current/20 hover:bg-white">
                ไปหน้าการเชื่อมต่อ
            </button>
        </div>
    );
}
