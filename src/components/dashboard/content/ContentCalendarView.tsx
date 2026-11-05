"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import DashboardEmptyState from "../DashboardEmptyState";
import ContentCalendarCard from "./ContentCalendarCard";
import { useContentCalendar } from "@/hooks/useContentCalendar";
import { ContentCalendarDay, ContentCalendarView as ViewMode } from "@/types/contentCalendar";

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
    { value: "daily", label: "รายวัน" },
    { value: "weekly", label: "รายสัปดาห์" },
    { value: "monthly", label: "รายเดือน" },
];

const WEEKDAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"]; // Monday-first

/** `date` is a "YYYY-MM-DD" Bangkok calendar label (not a real instant) -- parsed as UTC midnight, so a viewer on Bangkok's clock reads the correct day back out. */
function weekdayIndexMondayFirst(date: string): number {
    const sundayFirst = new Date(date).getUTCDay();
    return (sundayFirst + 6) % 7;
}

function formatDayLabel(date: string): string {
    return new Date(date).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatRangeLabel(days: ContentCalendarDay[], view: ViewMode): string {
    if (days.length === 0) return "";

    const first = days[0].date;
    const last = days[days.length - 1].date;

    if (view === "monthly") {
        return new Date(first).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    }

    if (first === last) {
        return new Date(first).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
    }

    return `${formatDayLabel(first)} - ${new Date(last).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function ContentCalendarView() {
    const { view, setView, navigate, goToToday, data, loading, error } = useContentCalendar();

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {VIEW_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setView(option.value)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                view === option.value
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("prev")}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
                        aria-label="ช่วงก่อนหน้า"
                    >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                    </button>
                    <button
                        onClick={goToToday}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        วันนี้
                    </button>
                    <button
                        onClick={() => navigate("next")}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
                        aria-label="ช่วงถัดไป"
                    >
                        <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </button>
                    {data && <span className="ml-1 text-sm font-medium text-slate-700">{formatRangeLabel(data.days, view)}</span>}
                </div>
            </div>

            {loading && <DashboardLoading />}
            {error && <DashboardError message={error} />}

            {data && data.hasData === false && (
                <DashboardEmptyState
                    message="ไม่มีโพสต์ในช่วงเวลานี้"
                    hint="ลองเปลี่ยนช่วงเวลา หรือซิงค์โพสต์จาก Facebook ก่อน"
                    action={<></>}
                />
            )}

            {data && data.hasData && view === "daily" && (
                <div className="space-y-3">
                    {data.days[0].posts.map((post) => (
                        <ContentCalendarCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {data && data.hasData && view !== "daily" && (
                <div className="overflow-x-auto">
                    <div className="grid min-w-[700px] grid-cols-7 gap-3">
                        {view === "monthly" &&
                            Array.from({ length: weekdayIndexMondayFirst(data.days[0].date) }).map((_, i) => <div key={`blank-${i}`} />)}

                        {data.days.map((day) => (
                            <div key={day.date} className="min-w-0">
                                <div className="mb-2 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        {WEEKDAY_LABELS[weekdayIndexMondayFirst(day.date)]}
                                    </p>
                                    <p className="text-xs font-medium text-slate-600">{formatDayLabel(day.date)}</p>
                                </div>

                                <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl bg-slate-50/50 p-1.5">
                                    {day.posts.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-300">-</div>
                                    ) : (
                                        day.posts.map((post) => <ContentCalendarCard key={post.id} post={post} />)
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
