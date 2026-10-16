"use client";

import { useEffect, useState } from "react";

interface AccountOption {
    id: string;
    name: string;
}

interface Props {
    onChanged: () => void;
}

/** Lets each company choose which Google Ads account (under the shared MCC) it reads data from. */
export default function GoogleAdsAccountPicker({ onChanged }: Props) {
    const [accounts, setAccounts] = useState<AccountOption[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/integrations/google-ads/accounts")
            .then((res) => res.json())
            .then((data) => {
                setAccounts(data.accounts ?? []);
                setSelectedId(data.selectedId ?? "");
                if (data.error) setError(data.error);
            })
            .catch(() => { });
    }, []);

    async function handleChange(customerId: string) {
        setSaving(true);
        setError(null);
        try {
            const response = await fetch("/api/integrations/google-ads/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? "เปลี่ยนบัญชีไม่สำเร็จ");
            setSelectedId(customerId);
            onChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : "เปลี่ยนบัญชีไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    }

    if (accounts.length === 0 && !error) return null;

    return (
        <div className="flex flex-col gap-1">
            {accounts.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                    บัญชีโฆษณา
                    <select
                        value={selectedId}
                        disabled={saving}
                        onChange={(e) => handleChange(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 disabled:opacity-50"
                    >
                        {!accounts.some((a) => a.id === selectedId) && <option value={selectedId}>{selectedId || "เลือกบัญชี"}</option>}
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name} ({account.id})
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}
