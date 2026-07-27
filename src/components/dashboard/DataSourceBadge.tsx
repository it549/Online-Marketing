type Props =
    | {
          source: "api";
          connected: boolean;
          lastSyncedAt: string | null;
          dateRangeLabel?: string | null;
      }
    | {
          source: "imported";
          fileCount: number;
          latestImportedAt: string | null;
      };

function formatDateTime(value: string | null): string | null {
    if (!value) return null;

    return new Date(value).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function DataSourceBadge(props: Props) {
    if (props.source === "api") {
        const synced = formatDateTime(props.lastSyncedAt);

        return (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">แหล่งข้อมูล: API</span>

                {props.connected ? (
                    <>
                        {synced && <span>อัปเดตล่าสุด {synced}</span>}
                        {props.dateRangeLabel && <span className="text-blue-500">· {props.dateRangeLabel}</span>}
                    </>
                ) : (
                    <span className="text-amber-600">ยังไม่ได้เชื่อมต่อ / เชื่อมต่อไม่สำเร็จ</span>
                )}
            </div>
        );
    }

    const imported = formatDateTime(props.latestImportedAt);

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">แหล่งข้อมูล: ไฟล์นำเข้า (CSV)</span>

            <span>{props.fileCount} ไฟล์ที่นำเข้าแล้ว</span>

            {imported && <span className="text-emerald-500">· ล่าสุด {imported}</span>}
        </div>
    );
}
