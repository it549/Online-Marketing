import Image from "next/image";
import { CampaignRow } from "@/types/campaigns";

const PLATFORM_META: Record<CampaignRow["platform"], { name: string; icon: string }> = {
    facebook: { name: "Facebook", icon: "/icons/facebook.svg" },
    shopee: { name: "Shopee", icon: "/icons/shopee.svg" },
    tiktok: { name: "TikTok", icon: "/icons/tiktok.svg" },
    googleAds: { name: "Google Ads", icon: "/icons/google-ads.svg" },
};

const TONE_CLASS: Record<CampaignRow["statusTone"], string> = {
    positive: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    neutral: "bg-slate-100 text-slate-500 ring-slate-200",
    negative: "bg-red-50 text-red-600 ring-red-200",
};

const TONE_DOT: Record<CampaignRow["statusTone"], string> = {
    positive: "bg-emerald-500",
    neutral: "bg-slate-400",
    negative: "bg-red-500",
};

interface Props {
    campaign: CampaignRow;
}

export default function CampaignCard({ campaign }: Props) {
    const platform = PLATFORM_META[campaign.platform];

    const stats: { label: string; value: string }[] = [
        { label: "ยอดใช้จ่าย", value: `฿${campaign.spend.toLocaleString()}` },
    ];

    if (campaign.revenue !== null) {
        stats.push({ label: "ยอดขาย", value: `฿${campaign.revenue.toLocaleString()}` });
    }

    if (campaign.roas !== null) {
        stats.push({ label: "ROAS", value: `${campaign.roas.toFixed(2)}x` });
    }

    stats.push({ label: campaign.secondaryLabel, value: campaign.secondaryValue });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                        <Image src={platform.icon} alt={platform.name} width={18} height={18} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
                        <p className="text-xs text-slate-400">{platform.name}</p>
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE_CLASS[campaign.statusTone]}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[campaign.statusTone]}`} />
                    {campaign.statusLabel}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
