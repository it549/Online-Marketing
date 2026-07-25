"use client";

import { useState } from "react";

import { ImportPlatformOption } from "@/types/import";
import { useImportCsv } from "@/hooks/useImportCsv";

interface Props {
    open: boolean;
    onClose: () => void;
    onImported?: () => void;
    endpoint: string;
    platforms: ImportPlatformOption[];
}

export default function ImportCsvModal({ open, onClose, onImported, endpoint, platforms }: Props) {
    const [platformCode, setPlatformCode] = useState<string>(platforms[0]?.code ?? "");
    const [file, setFile] = useState<File | null>(null);
    const { loading, error, result, submit, reset } = useImportCsv(endpoint);

    if (!open) return null;

    function handleClose() {
        setFile(null);
        reset();
        onClose();
    }

    async function handleSubmit() {
        if (!file) return;

        const imported = await submit(file, platformCode);

        if (imported) {
            onImported?.();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">นำเข้าไฟล์ CSV</h3>

                    <button onClick={handleClose} className="text-slate-400 hover:text-white">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs text-slate-400">แพลตฟอร์ม</label>

                        <select
                            value={platformCode}
                            onChange={(e) => setPlatformCode(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                        >
                            {platforms.map((platform) => (
                                <option key={platform.code} value={platform.code} disabled={!platform.enabled}>
                                    {platform.name}
                                    {!platform.enabled ? " (เร็วๆ นี้)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-slate-400">ไฟล์ CSV</label>

                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-blue-500"
                        />
                    </div>

                    {error && <p className="text-sm text-red-400">⚠️ {error}</p>}

                    {result && (
                        <p className="text-sm text-emerald-400">
                            นำเข้าสำเร็จ {result.totalRecords} รายการ (Job #{result.importJobId})
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={handleClose}
                            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                        >
                            ปิด
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={!file || loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "กำลังนำเข้า..." : "นำเข้าไฟล์"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
