"use client";

import { useState } from "react";

import ImportCsvModal from "./ImportCsvModal";
import { ImportPlatformOption } from "@/types/import";

interface Props {
    onImported?: () => void;
    endpoint: string;
    platforms: ImportPlatformOption[];
}

export default function ImportCsvButton({ onImported, endpoint, platforms }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800"
            >
                📥 นำเข้าไฟล์ CSV
            </button>

            <ImportCsvModal
                open={open}
                onClose={() => setOpen(false)}
                endpoint={endpoint}
                platforms={platforms}
                onImported={() => {
                    setOpen(false);
                    onImported?.();
                }}
            />
        </>
    );
}
