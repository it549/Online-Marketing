import ImportCsvButton from "./ImportCsvButton";
import { ImportPlatformOption } from "@/types/import";

interface Props {
    onImported?: () => void;
    endpoint: string;
    platforms: ImportPlatformOption[];
}

export default function DashboardEmptyState({ onImported, endpoint, platforms }: Props) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <p className="text-slate-600">ยังไม่มีข้อมูลสำหรับแพลตฟอร์มนี้</p>

            <p className="text-sm text-slate-400">นำเข้าไฟล์ CSV เพื่อเริ่มแสดงผล Dashboard</p>

            <div className="mt-2">
                <ImportCsvButton onImported={onImported} endpoint={endpoint} platforms={platforms} />
            </div>
        </div>
    );
}
