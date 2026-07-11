"use client";
import { useState } from "react";
import Dashboard from "@/components/dashboard/Dashboard";
import ContentGenerator from "@/components/contentgenerate/ContentGenerator";
import AdPlanner from "@/components/adplanner/AdPlanner";

const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "content", label: "✍️ สร้าง Content" },
    { id: "adplan", label: "🎯 วางแผนโฆษณา" },
];

export default function Home() {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">🏗️ Nilaphatra Marketing AI</h1>
                        <p className="text-slate-400 text-sm">AI ช่วยวางแผนโฆษณา Facebook & TikTok</p>
                    </div>
                    <div className="text-slate-400 text-sm">บริษัท นิลภัทร คอร์ปอเรชั่น จำกัด</div>
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
