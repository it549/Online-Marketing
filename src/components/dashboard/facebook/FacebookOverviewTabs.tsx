"use client";

import { LucideIcon, Megaphone, Newspaper, Sparkles } from "lucide-react";
import { useFacebookApiPerformance } from "@/hooks/useFacebookApiPerformance";
import { useFacebookContentAnalytics } from "@/hooks/useFacebookContentAnalytics";

export type FacebookTabKey = "ads" | "organic" | "ai";

function formatCurrency(value: number): string {
    return `฿${Math.round(value).toLocaleString()}`;
}

const ACCENT = {
    blue: {
        badge: "bg-blue-100 text-blue-600",
        activeBorder: "border-blue-500 ring-1 ring-blue-500/20",
        activeValue: "text-blue-600",
    },
    emerald: {
        badge: "bg-emerald-100 text-emerald-600",
        activeBorder: "border-emerald-500 ring-1 ring-emerald-500/20",
        activeValue: "text-emerald-600",
    },
    indigo: {
        badge: "bg-indigo-100 text-indigo-600",
        activeBorder: "border-indigo-500 ring-1 ring-indigo-500/20",
        activeValue: "text-indigo-600",
    },
} as const;

interface TabTileProps {
    accent: keyof typeof ACCENT;
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function TabTile({ accent, icon: Icon, label, isActive, onClick, children }: TabTileProps) {
    const styles = ACCENT[accent];

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={onClick}
            className={`flex-1 rounded-2xl border bg-white p-5 text-left shadow-sm transition-all ${isActive ? styles.activeBorder : "border-slate-200 hover:border-slate-300"
                }`}
        >
            <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.badge}`}>
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            </div>

            {children}
        </button>
    );
}

interface Props {
    activeTab: FacebookTabKey;
    onChange: (tab: FacebookTabKey) => void;
}

export default function FacebookOverviewTabs({ activeTab, onChange }: Props) {
    const { data: ads, loading: adsLoading } = useFacebookApiPerformance();
    const { data: organic, loading: organicLoading } = useFacebookContentAnalytics();

    const cpl = ads?.summary && ads.summary.leads > 0 ? formatCurrency(ads.summary.spend / ads.summary.leads) : "-";

    return (
        <div role="tablist" aria-label="สลับมุมมอง Facebook" className="flex flex-col gap-3 md:flex-row">
            <TabTile accent="blue" icon={Megaphone} label="ผลลัพธ์โฆษณา" isActive={activeTab === "ads"} onClick={() => onChange("ads")}>
                {adsLoading ? (
                    <div className="mt-4 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
                ) : !ads?.connected ? (
                    <p className="mt-4 text-sm text-slate-400">{ads?.error ?? "ยังไม่ได้เชื่อมต่อ"}</p>
                ) : (
                    <>
                        <p className={`mt-3 text-3xl font-bold tracking-tight ${activeTab === "ads" ? ACCENT.blue.activeValue : "text-slate-900"}`}>
                            {ads.summary ? formatCurrency(ads.summary.spend) : "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            {ads.summary ? `Leads ${ads.summary.leads.toLocaleString()} · CPL ${cpl}` : "ยอดใช้จ่าย"}
                        </p>
                    </>
                )}
            </TabTile>

            <TabTile
                accent="emerald"
                icon={Newspaper}
                label="ผลลัพธ์ออร์แกนิก"
                isActive={activeTab === "organic"}
                onClick={() => onChange("organic")}
            >
                {organicLoading ? (
                    <div className="mt-4 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
                ) : !organic?.hasData ? (
                    <p className="mt-4 text-sm text-slate-400">ยังไม่มีข้อมูลที่นำเข้า</p>
                ) : (
                    <>
                        <p
                            className={`mt-3 text-3xl font-bold tracking-tight ${activeTab === "organic" ? ACCENT.emerald.activeValue : "text-slate-900"
                                }`}
                        >
                            {organic.totalReach.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Reach · Engagement {organic.totalEngagement.toLocaleString()}
                        </p>
                    </>
                )}
            </TabTile>

            <TabTile accent="indigo" icon={Sparkles} label="สรุปด้วย AI" isActive={activeTab === "ai"} onClick={() => onChange("ai")}>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    ให้ AI วิเคราะห์ภาพรวมโฆษณา + ออร์แกนิกร่วมกัน แนะนำสิ่งที่ควรทำต่อ
                </p>
            </TabTile>
        </div>
    );
}
