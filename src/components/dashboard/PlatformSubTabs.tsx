export type PlatformSubTab = "api" | "imported" | "ai";

const TABS: { id: PlatformSubTab; label: string }[] = [
    { id: "api", label: "API Performance" },
    { id: "imported", label: "Imported Analytics" },
    { id: "ai", label: "AI Insights" },
];

interface Props {
    value: PlatformSubTab;
    onChange: (tab: PlatformSubTab) => void;
}

export default function PlatformSubTabs({ value, onChange }: Props) {
    return (
        <div className="flex gap-1 border-b border-slate-700">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        value === tab.id
                            ? "border-b-2 border-blue-400 text-blue-400"
                            : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
