"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Building2, Check } from "lucide-react";

import { useFacebookApiPerformance } from "@/hooks/useFacebookApiPerformance";
import { useShopeeDashboard } from "@/hooks/useShopeeDashboard";
import { useTikTokApiPerformance } from "@/hooks/useTikTokApiPerformance";
import { useGoogleAdsApiPerformance } from "@/hooks/useGoogleAdsApiPerformance";
import { CompanyPlatformId } from "@/types/company";

interface Company {
    id: string;
    name: string;
    code: string;
    platforms: CompanyPlatformId[];
}

interface PlatformCardProps {
    name: string;
    icon: string;
    connected: boolean;
    detail: string;
    description: string;
}

function PlatformCard({ name, icon, connected, detail, description }: PlatformCardProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                        <Image src={icon} alt={name} width={20} height={20} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-400">{detail}</p>
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        connected ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {connected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ"}
                </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">{description}</p>
        </div>
    );
}

export default function IntegrationsPage() {
    const facebook = useFacebookApiPerformance();
    const shopee = useShopeeDashboard();
    const tiktok = useTikTokApiPerformance();
    const googleAds = useGoogleAdsApiPerformance();

    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        fetch("/api/company")
            .then((res) => res.json())
            .then((data) => {
                setCompanies(data.companies ?? []);
                setSelectedId(data.selectedCompanyId ?? null);
            })
            .catch(() => {});
    }, []);

    async function handleSwitch(companyId: string) {
        if (switching || companyId === selectedId) return;

        setSwitching(true);

        try {
            await fetch("/api/company/select", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId }),
            });

            window.location.reload();
        } catch {
            setSwitching(false);
        }
    }

    const currentCompany = companies.find((c) => c.id === selectedId);
    const otherCompanies = companies.filter((c) => c.id !== selectedId);
    const platforms = currentCompany?.platforms ?? ["facebook", "shopee", "tiktok"];

    const shopeeImportedAt = shopee.data?.importBatches[0]?.importedAt ?? null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">การเชื่อมต่อ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    แหล่งข้อมูลที่เชื่อมต่อกับ {currentCompany?.name ?? "บริษัทนี้"} · ข้อมูลจะไม่ถูกแชร์ระหว่างบริษัท
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {platforms.includes("facebook") && (
                    <PlatformCard
                        name="Facebook"
                        icon="/icons/facebook.svg"
                        connected={facebook.data?.connected ?? false}
                        detail={facebook.data?.connected ? "Facebook Ads API" : "ยังไม่ได้ตั้งค่า"}
                        description={
                            facebook.data?.connected
                                ? "ดึงข้อมูลแคมเปญและยอดใช้จ่ายโฆษณาโดยตรงจาก Facebook Ads API"
                                : facebook.data?.error ?? "ยังไม่ได้ตั้งค่า Ad Account สำหรับบริษัทนี้"
                        }
                    />
                )}

                {platforms.includes("shopee") && (
                    <PlatformCard
                        name="Shopee"
                        icon="/icons/shopee.svg"
                        connected={shopee.data?.hasData ?? false}
                        detail={shopee.data?.hasData ? `${shopee.data.importBatches.length} ไฟล์ที่นำเข้าแล้ว` : "ยังไม่มีไฟล์นำเข้า"}
                        description={
                            shopee.data?.hasData
                                ? `ข้อมูลยอดขายและโฆษณาจากไฟล์ CSV ที่นำเข้า · ล่าสุด ${
                                      shopeeImportedAt ? new Date(shopeeImportedAt).toLocaleDateString("th-TH") : "-"
                                  }`
                                : "นำเข้าไฟล์รายงานจากหน้า Dashboard > Shopee เพื่อเริ่มดูข้อมูล"
                        }
                    />
                )}

                {platforms.includes("tiktok") && (
                    <PlatformCard
                        name="TikTok"
                        icon="/icons/tiktok.svg"
                        connected={tiktok.data?.connected ?? false}
                        detail={tiktok.data?.connected ? "TikTok Ads API" : "ยังไม่ได้ตั้งค่า"}
                        description={
                            tiktok.data?.connected
                                ? "ดึงข้อมูลแคมเปญและยอดใช้จ่ายโฆษณาโดยตรงจาก TikTok Ads API"
                                : tiktok.data?.error ?? "ยังไม่ได้ตั้งค่า Advertiser ID สำหรับบริษัทนี้"
                        }
                    />
                )}

                {platforms.includes("googleAds") && (
                    <PlatformCard
                        name="Google Ads"
                        icon="/icons/google-ads.svg"
                        connected={googleAds.data?.connected ?? false}
                        detail={googleAds.data?.connected ? "Google Ads API" : "ยังไม่ได้ตั้งค่า"}
                        description={
                            googleAds.data?.connected
                                ? "ดึงข้อมูลแคมเปญและยอดใช้จ่ายโฆษณาโดยตรงจาก Google Ads API"
                                : googleAds.data?.error ?? "ยังไม่ได้ตั้งค่า Customer ID สำหรับบริษัทนี้"
                        }
                    />
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">บริษัทอื่นในระบบ</h3>
                <p className="mt-1 text-xs text-slate-400">สลับบริษัทเพื่อจัดการการเชื่อมต่อของบริษัทนั้น</p>

                <div className="mt-4 space-y-2">
                    {otherCompanies.length === 0 && <p className="text-sm text-slate-400">ไม่มีบริษัทอื่นในระบบ</p>}

                    {otherCompanies.map((company) => (
                        <button
                            key={company.id}
                            onClick={() => handleSwitch(company.id)}
                            disabled={switching}
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 disabled:opacity-50"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <Building2 className="h-4 w-4" strokeWidth={2} />
                            </div>
                            <span className="flex-1 truncate text-sm font-medium text-slate-900">{company.name}</span>
                            <span className="text-xs text-indigo-600">สลับไปบริษัทนี้</span>
                        </button>
                    ))}

                    {currentCompany && (
                        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
                                <Building2 className="h-4 w-4" strokeWidth={2} />
                            </div>
                            <span className="flex-1 truncate text-sm font-medium text-slate-900">{currentCompany.name}</span>
                            <Check className="h-4 w-4 text-indigo-600" strokeWidth={2} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
