import {
    DollarSign,
    TrendingUp,
    Wallet,
    Percent,
    ShoppingCart,
    MousePointerClick,
    Eye,
    Users,
    MousePointer,
    UserPlus,
    Coins,
    Heart,
    FileText,
    BarChart3,
    LucideIcon,
} from "lucide-react";
import { DashboardMetric } from "@/types/metric";

interface Props {
    metric: DashboardMetric;
}

const ICON_BY_ID: Record<string, LucideIcon> = {
    spend: DollarSign,
    revenue: TrendingUp,
    profit: Wallet,
    roas: Percent,
    orders: ShoppingCart,
    ctr: MousePointerClick,
    impressions: Eye,
    reach: Users,
    clicks: MousePointer,
    leads: UserPlus,
    lead: UserPlus,
    cpl: Coins,
    views: Eye,
    reactions: Heart,
    engagement: Heart,
    posts: FileText,
};

const CHIP_BY_COLOR: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    cyan: "bg-cyan-50 text-cyan-600",
    sky: "bg-sky-50 text-sky-600",
    pink: "bg-pink-50 text-pink-600",
    teal: "bg-teal-50 text-teal-600",
};

const DEFAULT_CHIP = "bg-slate-100 text-slate-500";

export default function MetricCard({ metric }: Props) {
    const Icon = ICON_BY_ID[metric.id] ?? BarChart3;
    const colorWord = metric.color?.match(/text-([a-z]+)-\d+/)?.[1];
    const chipClass = (colorWord && CHIP_BY_COLOR[colorWord]) ?? DEFAULT_CHIP;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{metric.label}</p>

                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chipClass}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
            </div>

            <p className={`text-2xl font-bold tracking-tight ${metric.color ?? "text-slate-900"}`}>{metric.value}</p>

            {metric.subtitle && <p className="mt-1 text-xs text-slate-400">{metric.subtitle}</p>}
        </div>
    );
}
