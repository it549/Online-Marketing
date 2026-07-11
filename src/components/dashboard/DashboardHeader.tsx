export default function DashboardHeader({ title, subtitle, lastUpdated }: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>

                {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>

            {lastUpdated && <span className="text-xs text-slate-500">Updated {lastUpdated}</span>}
        </div>
    );
}

interface DashboardHeaderProps {
    title: string;
    subtitle?: string;
    lastUpdated?: string;
}
