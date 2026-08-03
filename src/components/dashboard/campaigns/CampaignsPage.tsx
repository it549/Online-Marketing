"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import CampaignCard from "./CampaignCard";

import { useCampaigns } from "@/hooks/useCampaigns";
import { useSelectedCompany } from "@/hooks/useSelectedCompany";
import { CampaignPlatform } from "@/types/campaigns";

type FilterId = "all" | CampaignPlatform;

const PLATFORM_LABEL: Record<CampaignPlatform, string> = {
    facebook: "Facebook",
    shopee: "Shopee",
    tiktok: "TikTok",
    googleAds: "Google Ads",
};

export default function CampaignsPage() {
    const { data, loading, error, refetch } = useCampaigns();
    const { company } = useSelectedCompany();
    const [filter, setFilter] = useState<FilterId>("all");

    const platformFilters = company?.platforms ?? ["facebook", "shopee", "tiktok"];
    const filters: { id: FilterId; label: string }[] = [
        { id: "all", label: "ทั้งหมด" },
        ...platformFilters.map((platform) => ({ id: platform as FilterId, label: PLATFORM_LABEL[platform] })),
    ];

    const filteredCampaigns = useMemo(() => {
        if (!data) return [];
        if (filter === "all") return data.campaigns;
        return data.campaigns.filter((campaign) => campaign.platform === filter);
    }, [data, filter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">แคมเปญ</h1>
                    <p className="mt-1 text-sm text-slate-500">แคมเปญโฆษณาแยกตามแพลตฟอร์ม เรียงตามค่าใช้จ่ายสูงสุด</p>
                </div>

                <button
                    onClick={refetch}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
                    รีเฟรช
                </button>
            </div>

            {loading && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && (
                <>
                    <div className="flex flex-wrap gap-2">
                        {filters.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    filter === item.id
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {filteredCampaigns.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
                            ยังไม่มีข้อมูลแคมเปญสำหรับตัวกรองนี้
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {filteredCampaigns.map((campaign) => (
                                <CampaignCard key={campaign.id} campaign={campaign} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
