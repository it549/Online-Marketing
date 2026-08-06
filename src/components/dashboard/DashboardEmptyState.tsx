import type { ReactNode } from "react";
import ImportCsvButton from "./ImportCsvButton";
import { ImportPlatformOption } from "@/types/import";

interface Props {
    onImported?: () => void;
    endpoint?: string;
    platforms?: ImportPlatformOption[];
    message?: string;
    hint?: string;
    /** Overrides the default CSV-import button -- pass for data sources (e.g. ETL-synced) where CSV import isn't the right call to action. */
    action?: ReactNode;
}

export default function DashboardEmptyState({ onImported, endpoint, platforms, message, hint, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <p className="text-slate-600">{message ?? "ยังไม่มีข้อมูลสำหรับแพลตฟอร์มนี้"}</p>

            <p className="text-sm text-slate-400">{hint ?? "นำเข้าไฟล์ CSV เพื่อเริ่มแสดงผล Dashboard"}</p>

            <div className="mt-2">
                {action ?? (endpoint && platforms && <ImportCsvButton onImported={onImported} endpoint={endpoint} platforms={platforms} />)}
            </div>
        </div>
    );
}
