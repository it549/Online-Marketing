import { Activity, FileText, Sparkles } from "lucide-react";

export type PlatformSubTab = "api" | "imported" | "ai";

const TABS: { id: PlatformSubTab; label: string; icon: typeof Activity }[] = [
    { id: "api", label: "API Performance", icon: Activity },
    { id: "imported", label: "Imported Analytics", icon: FileText },
    { id: "ai", label: "AI Insights", icon: Sparkles },
];

interface Props {
    value: PlatformSubTab;
    onChange: (tab: PlatformSubTab) => void;
}

export default function PlatformSubTabs({ value, onChange }: Props) {
    return (
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = value === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
