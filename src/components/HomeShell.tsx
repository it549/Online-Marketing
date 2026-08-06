"use client";
import { useState } from "react";
import Image from "next/image";
import {
    LayoutDashboard,
    LayoutGrid,
    PenLine,
    Target,
    LogOut,
    ChevronDown,
    ListChecks,
    Plug,
    Users,
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

import CompanySwitcher from "@/components/CompanySwitcher";
import OverviewPage from "@/components/dashboard/overview/OverviewPage";
import FacebookDashboard from "@/components/dashboard/FacebookDashboard";
import ShopeeDashboard from "@/components/dashboard/ShopeeDashboard";
import TikTokDashboard from "@/components/dashboard/TikTokDashboard";
import GoogleAdsDashboard from "@/components/dashboard/GoogleAdsDashboard";
import CampaignsPage from "@/components/dashboard/campaigns/CampaignsPage";
import IntegrationsPage from "@/components/dashboard/integrations/IntegrationsPage";
import InsightsPage from "@/components/dashboard/insights/InsightsPage";
import ContentGenerator from "@/components/contentgenerate/ContentGenerator";
import AdPlanner from "@/components/adplanner/AdPlanner";
import LogoutButton from "@/components/auth/LogoutButton";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";
import { CompanyPlatformId } from "@/types/company";

type View = "overview" | "facebook" | "shopee" | "tiktok" | "googleads" | "campaigns" | "integrations" | "insights" | "content" | "adplan";

const VALID_VIEWS: View[] = ["overview", "facebook", "shopee", "tiktok", "googleads", "campaigns", "integrations", "insights", "content", "adplan"];

/** Lets a redirect back from an OAuth callback (e.g. `?view=integrations`) land on the right tab. */
function getInitialView(): View {
    if (typeof window === "undefined") return "overview";
    const requested = new URLSearchParams(window.location.search).get("view");
    return VALID_VIEWS.includes(requested as View) ? (requested as View) : "overview";
}

const PLATFORM_NAV: Record<CompanyPlatformId, { id: View; label: string; icon: string }> = {
    facebook: { id: "facebook", label: "Facebook", icon: "/icons/facebook.svg" },
    shopee: { id: "shopee", label: "Shopee", icon: "/icons/shopee.svg" },
    tiktok: { id: "tiktok", label: "TikTok", icon: "/icons/tiktok.svg" },
    googleAds: { id: "googleads", label: "Google Ads", icon: "/icons/google-ads.svg" },
};

const OVERVIEW_VIEW: { id: View; label: string; icon: string } = { id: "overview", label: "ภาพรวม", icon: "" };

const STANDALONE_VIEWS: { id: View; label: string; icon: typeof ListChecks }[] = [
    { id: "campaigns", label: "แคมเปญ", icon: ListChecks },
    { id: "insights", label: "อินไซต์ผู้ชม", icon: Users },
    { id: "integrations", label: "การเชื่อมต่อ", icon: Plug },
];

const TOOL_VIEWS: { id: View; label: string }[] = [
    { id: "content", label: "สร้าง Content" },
    { id: "adplan", label: "วางแผนโฆษณา" },
];

interface Props {
    userEmail: string;
}

export default function HomeShell({ userEmail }: Props) {
    const [activeView, setActiveView] = useState<View>(getInitialView);
    const [dashboardExpanded, setDashboardExpanded] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { company } = useSelectedCompany();

    const platformViews = (company?.platforms ?? ["facebook", "shopee", "tiktok"]).map((platform) => PLATFORM_NAV[platform]);
    const dashboardViews = [OVERVIEW_VIEW, ...platformViews];

    const isDashboardSection = dashboardViews.some((v) => v.id === activeView);

    function selectView(view: View) {
        setActiveView(view);
        setMobileOpen(false);
    }

    // Applied to nav labels/section headers so they vanish only when the sidebar is
    // collapsed on desktop -- on mobile the drawer is always full width, so labels stay.
    const labelHiddenClass = collapsed ? "lg:hidden" : "";
    const itemJustifyClass = collapsed ? "lg:justify-center" : "";

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100">
            {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-200 ease-in-out lg:static lg:translate-x-0 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                } ${collapsed ? "w-64 lg:w-20" : "w-64"}`}
            >
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-5 lg:px-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg">
                        🏗️
                    </div>
                    <div className={`min-w-0 flex-1 ${labelHiddenClass}`}>
                        <p className="truncate text-sm font-bold leading-tight text-slate-900">Marketing Management</p>
                        <p className="truncate text-xs text-slate-400">AI ช่วยวางแผนโฆษณา</p>
                    </div>

                    <button onClick={() => setMobileOpen(false)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 lg:hidden" aria-label="ปิดเมนู">
                        <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                </div>

                <div className={labelHiddenClass}>
                    <CompanySwitcher />
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-4">
                    <div>
                        <p className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${labelHiddenClass}`}>เมนูหลัก</p>

                        <button
                            onClick={() => setDashboardExpanded((v) => !v)}
                            title="แดชบอร์ด"
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${itemJustifyClass} ${
                                isDashboardSection ? "text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <LayoutDashboard className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                            <span className={`flex-1 text-left ${labelHiddenClass}`}>แดชบอร์ด</span>
                            <ChevronDown
                                className={`h-3.5 w-3.5 shrink-0 transition-transform ${dashboardExpanded ? "rotate-180" : ""} ${labelHiddenClass}`}
                                strokeWidth={2}
                            />
                        </button>

                        {(dashboardExpanded || collapsed) && (
                            <div className={`mt-1 space-y-1 ${collapsed ? "lg:border-0 lg:pl-0" : "border-l border-slate-100 pl-4"}`}>
                                {dashboardViews.map((view) => {
                                    const active = activeView === view.id;

                                    return (
                                        <button
                                            key={view.id}
                                            onClick={() => selectView(view.id)}
                                            title={view.label}
                                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${itemJustifyClass} ${
                                                active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            {view.icon ? (
                                                <Image src={view.icon} alt="" width={16} height={16} className="shrink-0" />
                                            ) : (
                                                <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
                                            )}
                                            <span className={labelHiddenClass}>{view.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-1 space-y-1">
                            {STANDALONE_VIEWS.map((view) => {
                                const active = activeView === view.id;
                                const Icon = view.icon;

                                return (
                                    <button
                                        key={view.id}
                                        onClick={() => selectView(view.id)}
                                        title={view.label}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${itemJustifyClass} ${
                                            active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                                        <span className={labelHiddenClass}>{view.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${labelHiddenClass}`}>เครื่องมือ AI</p>

                        <div className="space-y-1">
                            {TOOL_VIEWS.map((view) => {
                                const active = activeView === view.id;
                                const Icon = view.id === "content" ? PenLine : Target;

                                return (
                                    <button
                                        key={view.id}
                                        onClick={() => selectView(view.id)}
                                        title={view.label}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${itemJustifyClass} ${
                                            active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                                        <span className={labelHiddenClass}>{view.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="hidden items-center justify-center gap-2 border-t border-slate-100 py-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 lg:flex"
                    aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
                >
                    {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" strokeWidth={2} /> : <PanelLeftClose className="h-4.5 w-4.5" strokeWidth={2} />}
                </button>

                <div className="border-t border-slate-100 p-4">
                    <div className={`flex items-center gap-3 rounded-lg px-2 py-2 ${itemJustifyClass}`}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {userEmail.slice(0, 2).toUpperCase()}
                        </div>
                        <p className={`min-w-0 flex-1 truncate text-xs font-medium text-slate-600 ${labelHiddenClass}`}>{userEmail}</p>
                        <LogoutButton className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                            <LogOut className="h-4 w-4" strokeWidth={2} />
                        </LogoutButton>
                    </div>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
                    <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50" aria-label="เปิดเมนู">
                        <Menu className="h-5 w-5" strokeWidth={2} />
                    </button>
                    <p className="text-sm font-bold text-slate-900">Marketing Management</p>
                </header>

                <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        {activeView === "overview" && <OverviewPage />}
                        {activeView === "facebook" && <FacebookDashboard />}
                        {activeView === "shopee" && <ShopeeDashboard />}
                        {activeView === "tiktok" && <TikTokDashboard />}
                        {activeView === "googleads" && <GoogleAdsDashboard />}
                        {activeView === "campaigns" && <CampaignsPage />}
                        {activeView === "insights" && <InsightsPage />}
                        {activeView === "integrations" && <IntegrationsPage />}
                        {activeView === "content" && <ContentGenerator />}
                        {activeView === "adplan" && <AdPlanner />}
                    </div>
                </main>
            </div>
        </div>
    );
}
