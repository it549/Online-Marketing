"use client";

import { useEffect, useState } from "react";

interface Props {
    onSaved: () => void;
}

const INPUT = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700";

/** Per-company Google Ads app credentials. Blank fields fall back to the shared env values. */
export default function GoogleAdsCredentialsForm({ onSaved }: Props) {
    const [open, setOpen] = useState(false);
    const [clientId, setClientId] = useState("");
    const [loginCustomerId, setLoginCustomerId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [developerToken, setDeveloperToken] = useState("");
    const [hasClientSecret, setHasClientSecret] = useState(false);
    const [hasDeveloperToken, setHasDeveloperToken] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        fetch("/api/integrations/google-ads/credentials")
            .then((res) => res.json())
            .then((data) => {
                setClientId(data.clientId ?? "");
                setLoginCustomerId(data.loginCustomerId ?? "");
                setHasClientSecret(!!data.hasClientSecret);
                setHasDeveloperToken(!!data.hasDeveloperToken);
            })
            .catch(() => { });
    }, []);

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        try {
            const response = await fetch("/api/integrations/google-ads/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId, loginCustomerId, clientSecret, developerToken }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
            setHasClientSecret(hasClientSecret || !!clientSecret);
            setHasDeveloperToken(hasDeveloperToken || !!developerToken);
            setClientSecret("");
            setDeveloperToken("");
            setMessage({ ok: true, text: "บันทึกแล้ว — ถ้าเปลี่ยน Client ID/Secret ต้องกดเชื่อมต่อ Google Ads ใหม่" });
            onSaved();
        } catch (err) {
            setMessage({ ok: false, text: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full max-w-md">
            <button onClick={() => setOpen(!open)} className="text-xs font-medium text-blue-600 hover:underline">
                {open ? "ซ่อนการตั้งค่า API ของบริษัทนี้" : "ตั้งค่า API ของบริษัทนี้"}
            </button>
            {open && (
                <div className="mt-2 space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">เว้นว่างเพื่อใช้ค่ากลางของระบบ (env) ค่าลับจะไม่ถูกแสดงกลับ</p>
                    <input className={INPUT} placeholder="OAuth Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} />
                    <input
                        className={INPUT}
                        type="password"
                        autoComplete="off"
                        placeholder={hasClientSecret ? "OAuth Client Secret (ตั้งไว้แล้ว — เว้นว่างเพื่อคงเดิม)" : "OAuth Client Secret"}
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                    />
                    <input
                        className={INPUT}
                        type="password"
                        autoComplete="off"
                        placeholder={hasDeveloperToken ? "Developer Token (ตั้งไว้แล้ว — เว้นว่างเพื่อคงเดิม)" : "Developer Token"}
                        value={developerToken}
                        onChange={(e) => setDeveloperToken(e.target.value)}
                    />
                    <input className={INPUT} placeholder="MCC ID (10 หลัก)" value={loginCustomerId} onChange={(e) => setLoginCustomerId(e.target.value)} />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                    {message && <p className={`text-xs ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
                </div>
            )}
        </div>
    );
}
