"use client";
import { useState } from "react";
import Dashboard from "@/components/dashboard/Dashboard";
import ContentGenerator from "@/components/contentgenerate/ContentGenerator";
import AdPlanner from "@/components/adplanner/AdPlanner";
import LogoutButton from "@/components/auth/LogoutButton";

const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "content", label: "✍️ สร้าง Content" },
    { id: "adplan", label: "🎯 วางแผนโฆษณา" },
];

interface Props {
    userEmail: string;
}

export default function HomeShell({ userEmail }: Props) {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">🏗️ Rungsiyo Marketing AI</h1>
                        <p className="text-slate-400 text-sm">AI ช่วยวางแผนโฆษณา Facebook & TikTok</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-slate-400 text-sm">{userEmail}</div>
                        <LogoutButton className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50" />
                    </div>
                </div>
            </header>

            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "text-blue-400 border-b-2 border-blue-400"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === "dashboard" && <Dashboard />}
                {activeTab === "content" && <ContentGenerator />}
                {activeTab === "adplan" && <AdPlanner />}
            </main>
        </div>
    );
}
