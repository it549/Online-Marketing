"use client";

import { CalendarDays } from "lucide-react";

interface Props {
    /** "YYYY-MM", or "" for the default range since the ads started. */
    value: string;
    onChange: (month: string) => void;
}

// Shopee's Ads API rejects dates older than 6 months, so offer this month and the 5 before it.
const MONTHS_BACK = 6;

function recentMonths(): { value: string; label: string }[] {
    const now = new Date();
    return Array.from({ length: MONTHS_BACK }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
            value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            label: date.toLocaleDateString("th-TH", { month: "long", year: "numeric" }),
        };
    });
}

export default function ShopeeMonthSelect({ value, onChange }: Props) {
    return (
        <label className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" strokeWidth={2} />
            <span>ดูข้อมูลเดือน</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
                <option value="">ทั้งหมด (ตั้งแต่เริ่มแคมเปญ)</option>
                {recentMonths().map((month) => (
                    <option key={month.value} value={month.value}>
                        {month.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
