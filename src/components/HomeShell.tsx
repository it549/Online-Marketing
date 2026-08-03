"use client";
import { useState } from "react";
import Image from "next/image";
import { LayoutDashboard, LayoutGrid, PenLine, Target, LogOut, ChevronDown, ListChecks, Plug } from "lucide-react";

import CompanySwitcher from "@/components/CompanySwitcher";
import OverviewPage from "@/components/dashboard/overview/OverviewPage";
import FacebookDashboard from "@/components/dashboard/FacebookDashboard";
import ShopeeDashboard from "@/components/dashboard/ShopeeDashboard";
import TikTokDashboard from "@/components/dashboard/TikTokDashboard";
import GoogleAdsDashboard from "@/components/dashboard/GoogleAdsDashboard";
import CampaignsPage from "@/components/dashboard/campaigns/CampaignsPage";
import IntegrationsPage from "@/components/dashboard/integrations/IntegrationsPage";
import ContentGenerator from "@/components/contentgenerate/ContentGenerator";
import AdPlanner from "@/components/adplanner/AdPlanner";
import LogoutButton from "@/components/auth/LogoutButton";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";
import { CompanyPlatformId } from "@/types/company";

type View = "overview" | "facebook" | "shopee" | "tiktok" | "googleads" | "campaigns" | "integrations" | "content" | "adplan";

const VALID_VIEWS: View[] = ["overview", "facebook", "shopee", "tiktok", "googleads", "campaigns", "integrations", "content", "adplan"];

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
    const { company } = useSelectedCompany();

    const platformViews = (company?.platforms ?? ["facebook", "shopee", "tiktok"]).map((platform) => PLATFORM_NAV[platform]);
    const dashboardViews = [OVERVIEW_VIEW, ...platformViews];

    const isDashboardSection = dashboardViews.some((v) => v.id === activeView);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-100">
            <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg">
                        🏗️
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight text-slate-900">Marketing Management</p>
                        <p className="text-xs text-slate-400">AI ช่วยวางแผนโฆษณา</p>
                    </div>
                </div>

                <CompanySwitcher />

                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
                    <div>
                        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">เมนูหลัก</p>

                        <button
                            onClick={() => setDashboardExpanded((v) => !v)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                isDashboardSection ? "text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <LayoutDashboard className="h-4.5 w-4.5" strokeWidth={2} />
                            <span className="flex-1 text-left">แดชบอร์ด</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dashboardExpanded ? "rotate-180" : ""}`} strokeWidth={2} />
                        </button>

                        {dashboardExpanded && (
                            <div className="mt-1 space-y-1 border-l border-slate-100 pl-4">
                                {dashboardViews.map((view) => {
                                    const active = activeView === view.id;

                                    return (
                                        <button
                                            key={view.id}
                                            onClick={() => setActiveView(view.id)}
                                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            {view.icon ? (
                                                <Image src={view.icon} alt="" width={16} height={16} />
                                            ) : (
                                                <LayoutGrid className="h-4 w-4" strokeWidth={2} />
                                            )}
                                            {view.label}
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
                                        onClick={() => setActiveView(view.id)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                                        {view.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">เครื่องมือ AI</p>

                        <div className="space-y-1">
                            {TOOL_VIEWS.map((view) => {
                                const active = activeView === view.id;
                                const Icon = view.id === "content" ? PenLine : Target;

                                return (
                                    <button
                                        key={view.id}
                                        onClick={() => setActiveView(view.id)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                                        {view.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {userEmail.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{userEmail}</p>
                        <LogoutButton className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                            <LogOut className="h-4 w-4" strokeWidth={2} />
                        </LogoutButton>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
                <div className="mx-auto max-w-7xl">
                    {activeView === "overview" && <OverviewPage />}
                    {activeView === "facebook" && <FacebookDashboard />}
                    {activeView === "shopee" && <ShopeeDashboard />}
                    {activeView === "tiktok" && <TikTokDashboard />}
                    {activeView === "googleads" && <GoogleAdsDashboard />}
                    {activeView === "campaigns" && <CampaignsPage />}
                    {activeView === "integrations" && <IntegrationsPage />}
                    {activeView === "content" && <ContentGenerator />}
                    {activeView === "adplan" && <AdPlanner />}
                </div>
            </main>
        </div>
    );
}
