"use client";

import { ShopeePeriodGranularity } from "@/types/shopeeDashboard";

interface Props {
    value: ShopeePeriodGranularity;
    onChange: (period: ShopeePeriodGranularity) => void;
}

const OPTIONS: { value: ShopeePeriodGranularity; label: string }[] = [
    { value: "week", label: "รายสัปดาห์" },
    { value: "month", label: "รายเดือน" },
    { value: "quarter", label: "รายไตรมาส" },
];

export default function ShopeePeriodToggle({ value, onChange }: Props) {
    return (
        <div className="flex gap-2">
            {OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        value === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
