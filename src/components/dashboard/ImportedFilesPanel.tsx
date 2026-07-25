interface ImportBatch {
    id: string;
    filename: string;
    importedAt: string | null;
    totalRecords: number;
    periodLabel: string | null;
}

interface Props {
    batches: ImportBatch[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
}

function formatDateTime(value: string | null): string {
    if (!value) return "-";

    return new Date(value).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ImportedFilesPanel({ batches, selectedId, onSelect }: Props) {
    if (batches.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                <h3 className="text-sm font-semibold text-white">ไฟล์ที่นำเข้าแล้ว</h3>

                {onSelect && (
                    <select
                        value={selectedId ?? ""}
                        onChange={(e) => onSelect(e.target.value || null)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    >
                        <option value="">ทั้งหมด (สะสม)</option>

                        {batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                                {batch.filename}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-slate-400">
                        <th className="px-5 py-2 font-medium">ไฟล์</th>
                        <th className="px-5 py-2 font-medium">นำเข้าเมื่อ</th>
                        <th className="px-5 py-2 font-medium">ช่วงข้อมูล</th>
                        <th className="px-5 py-2 text-right font-medium">จำนวนแถว</th>
                    </tr>
                </thead>

                <tbody>
                    {batches.map((batch) => (
                        <tr key={batch.id} className={`border-t border-slate-700/60 ${selectedId === batch.id ? "bg-slate-700/30" : ""}`}>
                            <td className="px-5 py-2 text-slate-200">{batch.filename}</td>
                            <td className="px-5 py-2 text-slate-400">{formatDateTime(batch.importedAt)}</td>
                            <td className="px-5 py-2 text-slate-400">{batch.periodLabel ?? "-"}</td>
                            <td className="px-5 py-2 text-right text-slate-400">{batch.totalRecords.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
