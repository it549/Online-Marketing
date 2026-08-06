import { Activity, FileText, Sparkles } from "lucide-react";

export type PlatformSubTab = "api" | "imported" | "ai";

export interface SubTabDef<T extends string> {
    id: T;
    label: string;
    icon: typeof Activity;
}

const DEFAULT_TABS: SubTabDef<PlatformSubTab>[] = [
    { id: "api", label: "API Performance", icon: Activity },
    { id: "imported", label: "Imported Analytics", icon: FileText },
    { id: "ai", label: "AI Insights", icon: Sparkles },
];

interface Props<T extends string> {
    value: T;
    onChange: (tab: T) => void;
    /** Defaults to the original api/imported/ai set, so existing callers are unaffected. */
    tabs?: SubTabDef<T>[];
}

export default function PlatformSubTabs<T extends string = PlatformSubTab>({ value, onChange, tabs }: Props<T>) {
    const resolvedTabs = tabs ?? (DEFAULT_TABS as unknown as SubTabDef<T>[]);

    return (
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {resolvedTabs.map((tab) => {
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
