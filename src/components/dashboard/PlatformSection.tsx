import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type Accent = "blue" | "emerald" | "indigo";

const ACCENT_STYLES: Record<Accent, { badge: string; header: string; border: string }> = {
    blue: { badge: "bg-blue-100 text-blue-600", header: "bg-blue-50/60 border-blue-100", border: "border-blue-100" },
    emerald: { badge: "bg-emerald-100 text-emerald-600", header: "bg-emerald-50/60 border-emerald-100", border: "border-emerald-100" },
    indigo: { badge: "bg-indigo-100 text-indigo-600", header: "bg-indigo-50/60 border-indigo-100", border: "border-indigo-100" },
};

interface Props {
    accent: Accent;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    children: ReactNode;
}

export default function PlatformSection({ accent, icon: Icon, title, subtitle, children }: Props) {
    const styles = ACCENT_STYLES[accent];

    return (
        <section className={`overflow-hidden rounded-2xl border ${styles.border} bg-white shadow-sm`}>
            <div className={`flex items-center gap-2.5 border-b px-5 py-4 ${styles.header}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.badge}`}>
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </div>

                <div>
                    <h2 className="text-base font-bold text-slate-900">{title}</h2>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
            </div>

            <div className="space-y-6 p-5">{children}</div>
        </section>
    );
}
