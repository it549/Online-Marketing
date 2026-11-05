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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">ไฟล์ที่นำเข้าแล้ว</h3>

                {onSelect && (
                    <select
                        value={selectedId ?? ""}
                        onChange={(e) => onSelect(e.target.value || null)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
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
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-2">ไฟล์</th>
                        <th className="px-5 py-2">นำเข้าเมื่อ</th>
                        <th className="px-5 py-2">ช่วงข้อมูล</th>
                        <th className="px-5 py-2 text-right">จำนวนแถว</th>
                    </tr>
                </thead>

                <tbody>
                    {batches.map((batch) => (
                        <tr
                            key={batch.id}
                            className={`border-t border-slate-100 transition-colors ${selectedId === batch.id ? "bg-indigo-50" : ""}`}
                        >
                            <td className="px-5 py-2 text-slate-700">{batch.filename}</td>
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
