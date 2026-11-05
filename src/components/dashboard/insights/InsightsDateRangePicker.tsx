"use client";

interface Props {
    dateFrom: string;
    dateTo: string;
    onChange: (range: { dateFrom: string; dateTo: string }) => void;
}

const inputClassName = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none";

export default function InsightsDateRangePicker({ dateFrom, dateTo, onChange }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
                className={inputClassName}
                aria-label="วันที่เริ่มต้น"
            />

            <span className="text-xs text-slate-500">ถึง</span>

            <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
                className={inputClassName}
                aria-label="วันที่สิ้นสุด"
            />
        </div>
    );
}
