"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Building2, Check, PlugZap, RefreshCw, Unplug, X } from "lucide-react";

import { useFacebookApiPerformance } from "@/hooks/useFacebookApiPerformance";
import { useShopeeApiPerformance } from "@/hooks/useShopeeApiPerformance";
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
    action: ReactNode;
}

function PlatformCard({ name, icon, connected, detail, description, action }: PlatformCardProps) {
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
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${connected ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {connected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ"}
                </span>
            </div>

            <p className="mt-3 text-xs text-slate-500">{description}</p>

            <div className="mt-4">{action}</div>
        </div>
    );
}

/** Per-company Google Ads settings (own OAuth client, developer token, account ids). Blank secrets keep the saved value. */
function GoogleAdsSettingsForm({ onSaved, onError }: { onSaved: () => void; onError: (message: string) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [values, setValues] = useState({ clientId: "", clientSecret: "", developerToken: "", customerId: "", loginCustomerId: "" });
    const [saved, setSaved] = useState({ hasClientSecret: false, hasDeveloperToken: false });

    async function handleOpen() {
        setOpen(true);
        setLoading(true);
        try {
            const response = await fetch("/api/integrations/google-ads/credentials");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "โหลดการตั้งค่าไม่สำเร็จ");
            setValues({
                clientId: data.clientId,
                clientSecret: "",
                developerToken: "",
                customerId: data.customerId,
                loginCustomerId: data.loginCustomerId,
            });
            setSaved({ hasClientSecret: data.hasClientSecret, hasDeveloperToken: data.hasDeveloperToken });
        } catch (err) {
            onError(err instanceof Error ? err.message : "โหลดการตั้งค่าไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (saving) return;
        setSaving(true);
        try {
            const response = await fetch("/api/integrations/google-ads/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
            setOpen(false);
            onSaved();
        } catch (err) {
            onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    }

    if (!open) {
        return (
            <button onClick={handleOpen} className="w-fit text-left text-xs font-medium text-blue-600 hover:underline">
                ตั้งค่าการเชื่อมต่อ
            </button>
        );
    }

    const fields = [
        { key: "clientId", label: "OAuth Client ID", secret: false, hint: "" },
        { key: "clientSecret", label: "OAuth Client Secret", secret: true, hint: saved.hasClientSecret ? "บันทึกไว้แล้ว (เว้นว่างเพื่อใช้ค่าเดิม)" : "" },
        { key: "developerToken", label: "Developer Token", secret: true, hint: saved.hasDeveloperToken ? "บันทึกไว้แล้ว (เว้นว่างเพื่อใช้ค่าเดิม)" : "" },
        { key: "customerId", label: "Customer ID (บัญชีโฆษณา)", secret: false, hint: "" },
        { key: "loginCustomerId", label: "Login Customer ID (MCC, ถ้ามี)", secret: false, hint: "" },
    ] as const;

    return (
        <div className="flex w-full max-w-sm flex-col gap-2">
            {fields.map((field) => (
                <label key={field.key} className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    {field.label}
                    <input
                        type={field.secret ? "password" : "text"}
                        autoComplete="off"
                        disabled={loading}
                        placeholder={field.hint}
                        value={values[field.key]}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-normal text-slate-900 outline-none focus:border-blue-400 disabled:opacity-50"
                    />
                </label>
            ))}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleSubmit}
                    disabled={saving || loading}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                    บันทึก
                </button>
                <button onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:underline">
                    ยกเลิก
                </button>
            </div>
        </div>
    );
}

/** Per-company TikTok App ID / Secret. A blank secret keeps the saved value. */
function TikTokSettingsForm({ onSaved, onError }: { onSaved: () => void; onError: (message: string) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [values, setValues] = useState({ appId: "", appSecret: "" });
    const [hasAppSecret, setHasAppSecret] = useState(false);

    async function handleOpen() {
        setOpen(true);
        setLoading(true);
        try {
            const response = await fetch("/api/integrations/tiktok/credentials");
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ?? "โหลดการตั้งค่าไม่สำเร็จ");
            setValues({ appId: data.appId, appSecret: "" });
            setHasAppSecret(data.hasAppSecret);
        } catch (err) {
            onError(err instanceof Error ? err.message : "โหลดการตั้งค่าไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (saving) return;
        setSaving(true);
        try {
            const response = await fetch("/api/integrations/tiktok/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? "บันทึกไม่สำเร็จ");
            setOpen(false);
            onSaved();
        } catch (err) {
            onError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    }

    if (!open) {
        return (
            <button onClick={handleOpen} className="w-fit text-left text-xs font-medium text-blue-600 hover:underline">
                ตั้งค่าการเชื่อมต่อ
            </button>
        );
    }

    const fields = [
        { key: "appId", label: "App ID", secret: false, hint: "" },
        { key: "appSecret", label: "App Secret", secret: true, hint: hasAppSecret ? "บันทึกไว้แล้ว (เว้นว่างเพื่อใช้ค่าเดิม)" : "" },
    ] as const;

    return (
        <div className="flex w-full max-w-sm flex-col gap-2">
            {fields.map((field) => (
                <label key={field.key} className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    {field.label}
                    <input
                        type={field.secret ? "password" : "text"}
                        autoComplete="off"
                        disabled={loading}
                        placeholder={field.hint}
                        value={values[field.key]}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-normal text-slate-900 outline-none focus:border-blue-400 disabled:opacity-50"
                    />
                </label>
            ))}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleSubmit}
                    disabled={saving || loading}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                    บันทึก
                </button>
                <button onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:underline">
                    ยกเลิก
                </button>
            </div>
        </div>
    );
}

function RetryButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
        >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            {label}
        </button>
    );
}

const SHOPEE_STATUS_MESSAGES: Record<string, string> = {
    connected: "เชื่อมต่อ Shopee สำเร็จแล้ว",
};

type CallbackBanner = { tone: "success" | "error"; message: string } | null;

/** Reads the one-time OAuth-callback result out of the URL (e.g. `?shopee=connected`). */
function getInitialCallbackBanner(): CallbackBanner {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    const shopeeStatus = params.get("shopee");
    const googleAdsStatus = params.get("googleAds");
    const facebookStatus = params.get("facebook")
    const tiktokStatus = params.get("tiktok");

    if (tiktokStatus) {
        const message = params.get("message");
        return {
            tone: tiktokStatus === "connected" ? "success" : "error",
            message: message ?? "เชื่อมต่อ TikTok ไม่สำเร็จ",
        };
    }

    if (shopeeStatus) {
        const message = params.get("message");
        return {
            tone: shopeeStatus === "connected" ? "success" : "error",
            message: message ?? SHOPEE_STATUS_MESSAGES[shopeeStatus] ?? "เชื่อมต่อ Shopee ไม่สำเร็จ",
        };
    }

    if (googleAdsStatus) {
        const message = params.get("message");
        return {
            tone: googleAdsStatus === "connected" ? "success" : "error",
            message: message ?? "เชื่อมต่อ Google Ads ไม่สำเร็จ",
        };
    }

    if (facebookStatus) {
        const message = params.get("message");
        return {
            tone: facebookStatus === "connected" ? "success" : "error",
            message: message ?? "เชื่อมต่อ Facebook ไม่สำเร็จ",
        };
    }

    return null;
}

export default function IntegrationsPage() {
    const facebook = useFacebookApiPerformance();
    const shopeeApi = useShopeeApiPerformance();
    const tiktok = useTikTokApiPerformance();
    const googleAds = useGoogleAdsApiPerformance();

    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [switching, setSwitching] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const [callbackBanner, setCallbackBanner] = useState<CallbackBanner>(getInitialCallbackBanner);

    useEffect(() => {
        fetch("/api/company")
            .then((res) => res.json())
            .then((data) => {
                setCompanies(data.companies ?? []);
                setSelectedId(data.selectedCompanyId ?? null);
            })
            .catch(() => { });
    }, []);

    // Strip the one-time OAuth-callback query params so a page refresh doesn't re-show the banner.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("shopee") && !params.has("googleAds") && !params.has("facebook") && !params.has("tiktok")) return;

        params.delete("shopee");
        params.delete("message");
        params.delete("view");
        params.delete("googleAds");
        params.delete("facebook");
        params.delete("tiktok");
        const query = params.toString();
        window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
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

    async function handleShopeeDisconnect() {
        if (disconnecting) return;
        setDisconnecting(true);

        try {
            const response = await fetch("/api/integrations/shopee/disconnect", { method: "POST" });
            const result = await response.json();

            if (!response.ok) throw new Error(result.error ?? "ยกเลิกการเชื่อมต่อไม่สำเร็จ");

            setCallbackBanner({ tone: "success", message: "ยกเลิกการเชื่อมต่อ Shopee แล้ว" });
            await shopeeApi.refetch();
        } catch (err) {
            setCallbackBanner({ tone: "error", message: err instanceof Error ? err.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ" });
        } finally {
            setDisconnecting(false);
        }
    }

    const currentCompany = companies.find((c) => c.id === selectedId);
    const otherCompanies = companies.filter((c) => c.id !== selectedId);
    const platforms = currentCompany?.platforms ?? ["facebook", "shopee", "tiktok"];

    const [disconnectingGoogleAds, setDisconnectingGoogleAds] = useState(false);

    const googleAdsSettings = (
        <GoogleAdsSettingsForm
            onSaved={() => {
                setCallbackBanner({ tone: "success", message: "บันทึกการตั้งค่า Google Ads แล้ว" });
                googleAds.refetch();
            }}
            onError={(message) => setCallbackBanner({ tone: "error", message })}
        />
    );

    async function handleGoogleAdsDisconnect() {
        if (disconnectingGoogleAds) return;
        setDisconnectingGoogleAds(true);

        try {
            const response = await fetch("/api/integrations/google-ads/disconnect", { method: "POST" });
            const result = await response.json();

            if (!response.ok) throw new Error(result.error ?? "ยกเลิกการเชื่อมต่อไม่สำเร็จ");

            setCallbackBanner({ tone: "success", message: "ยกเลิกการเชื่อมต่อ Google Ads แล้ว" });
            await googleAds.refetch();
        } catch (err) {
            setCallbackBanner({ tone: "error", message: err instanceof Error ? err.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ" });
        } finally {
            setDisconnectingGoogleAds(false);
        }
    }

    const [disconnectingFacebook, setDisconnectingFacebook] = useState(false);

    async function handleFacebookDisconnect() {
        if (disconnectingFacebook) return;
        setDisconnectingFacebook(true);

        try {
            const response = await fetch("/api/integrations/facebook/disconnect", { method: "POST" });
            const result = await response.json();

            if (!response.ok) throw new Error(result.error ?? "ยกเลิกการเชื่อมต่อไม่สำเร็จ");

            setCallbackBanner({ tone: "success", message: "ยกเลิกการเชื่อมต่อ Facebook แล้ว" });
            await facebook.refetch();
        } catch (err) {
            setCallbackBanner({ tone: "error", message: err instanceof Error ? err.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ" });
        } finally {
            setDisconnectingFacebook(false);
        }
    }

    const [disconnectingTikTok, setDisconnectingTikTok] = useState(false);

    const tiktokSettings = (
        <TikTokSettingsForm
            onSaved={() => {
                setCallbackBanner({ tone: "success", message: "บันทึกการตั้งค่า TikTok แล้ว" });
                tiktok.refetch();
            }}
            onError={(message) => setCallbackBanner({ tone: "error", message })}
        />
    );

    async function handleTikTokDisconnect() {
        if (disconnectingTikTok) return;
        setDisconnectingTikTok(true);

        try {
            const response = await fetch("/api/integrations/tiktok/disconnect", { method: "POST" });
            const result = await response.json();

            if (!response.ok) throw new Error(result.error ?? "ยกเลิกการเชื่อมต่อไม่สำเร็จ");

            setCallbackBanner({ tone: "success", message: "ยกเลิกการเชื่อมต่อ TikTok แล้ว" });
            await tiktok.refetch();
        } catch (err) {
            setCallbackBanner({ tone: "error", message: err instanceof Error ? err.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ" });
        } finally {
            setDisconnectingTikTok(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">การเชื่อมต่อ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    แหล่งข้อมูลที่เชื่อมต่อกับ {currentCompany?.name ?? "บริษัทนี้"} · ข้อมูลจะไม่ถูกแชร์ระหว่างบริษัท
                </p>
            </div>

            {callbackBanner && (
                <div
                    className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${callbackBanner.tone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    <span>{callbackBanner.message}</span>
                    <button onClick={() => setCallbackBanner(null)} className="shrink-0 opacity-60 hover:opacity-100">
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {platforms.includes("facebook") && (
                    <PlatformCard
                        name="Facebook"
                        icon="/icons/facebook.svg"
                        connected={facebook.data?.connected ?? false}
                        detail={facebook.data?.connected ? "Facebook Ads API" : "ยังไม่ได้เชื่อมต่อ"}
                        description={
                            facebook.data?.connected
                                ? `ดึงข้อมูลแคมเปญและยอดใช้จ่ายโฆษณาโดยตรงจาก Facebook Ads API${facebook.data.lastSyncedAt ? ` · ซิงค์ล่าสุด ${new Date(facebook.data.lastSyncedAt).toLocaleString("th-TH")}` : ""
                                }`
                                : facebook.data?.error ?? "ยังไม่ได้เชื่อมต่อ Facebook กับบัญชีนี้"
                        }
                        action={
                            facebook.data?.connected ? (
                                <div className="flex items-center gap-2">
                                    <RetryButton label="ซิงค์ข้อมูลใหม่" loading={facebook.loading} onClick={facebook.refetch} />
                                    <button
                                        onClick={handleFacebookDisconnect}
                                        disabled={disconnectingFacebook}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Unplug className="h-3.5 w-3.5" strokeWidth={2} />
                                        ยกเลิกการเชื่อมต่อ
                                    </button>
                                </div>
                            ) : (

                                <a href="/api/integrations/facebook/connect"
                                    className="flex w-fit items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
                                >
                                    <PlugZap className="h-3.5 w-3.5" strokeWidth={2} />
                                    เชื่อมต่อ Facebook
                                </a>
                            )
                        }
                    />
                )}

                {platforms.includes("shopee") && (
                    <PlatformCard
                        name="Shopee"
                        icon="/icons/shopee.svg"
                        connected={shopeeApi.data?.connected ?? false}
                        detail={shopeeApi.data?.connected ? "Shopee Open API" : "ยังไม่ได้เชื่อมต่อ"}
                        description={
                            shopeeApi.data?.connected
                                ? `ดึงข้อมูลออเดอร์จากร้าน Shopee โดยตรงผ่าน Shopee Open API${shopeeApi.data.lastSyncedAt ? ` · ซิงค์ล่าสุด ${new Date(shopeeApi.data.lastSyncedAt).toLocaleString("th-TH")}` : ""
                                }`
                                : shopeeApi.data?.error ?? "ยังไม่ได้เชื่อมต่อ Shopee กับบัญชีนี้"
                        }
                        action={
                            shopeeApi.data?.connected ? (
                                <div className="flex items-center gap-2">
                                    <RetryButton label="ซิงค์ข้อมูลใหม่" loading={shopeeApi.loading} onClick={shopeeApi.refetch} />
                                    <button
                                        onClick={handleShopeeDisconnect}
                                        disabled={disconnecting}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Unplug className="h-3.5 w-3.5" strokeWidth={2} />
                                        ยกเลิกการเชื่อมต่อ
                                    </button>
                                </div>
                            ) : (
                                <a
                                    href="/api/integrations/shopee/connect"
                                    className="flex w-fit items-center gap-2 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
                                >
                                    <PlugZap className="h-3.5 w-3.5" strokeWidth={2} />
                                    เชื่อมต่อ Shopee
                                </a>
                            )
                        }
                    />
                )}

                {platforms.includes("tiktok") && (
                    <PlatformCard
                        name="TikTok"
                        icon="/icons/tiktok.svg"
                        connected={tiktok.data?.connected ?? false}
                        detail={tiktok.data?.connected ? "TikTok Ads API" : "ยังไม่ได้เชื่อมต่อ"}
                        description={
                            tiktok.data?.connected
                                ? `ดึงข้อมูลแคมเปญและยอดใช้จ่ายโฆษณาโดยตรงจาก TikTok Ads API${tiktok.data.lastSyncedAt ? ` · ซิงค์ล่าสุด ${new Date(tiktok.data.lastSyncedAt).toLocaleString("th-TH")}` : ""
                                }`
                                : tiktok.data?.error ?? "ยังไม่ได้เชื่อมต่อ TikTok กับบัญชีนี้"
                        }
                        action={
                            tiktok.data?.connected ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <RetryButton label="ซิงค์ข้อมูลใหม่" loading={tiktok.loading} onClick={tiktok.refetch} />
                                        <button
                                            onClick={handleTikTokDisconnect}
                                            disabled={disconnectingTikTok}
                                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <Unplug className="h-3.5 w-3.5" strokeWidth={2} />
                                            ยกเลิกการเชื่อมต่อ
                                        </button>
                                    </div>
                                    {tiktokSettings}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <a
                                        href="/api/integrations/tiktok/connect"
                                        className="flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                    >
                                        <PlugZap className="h-3.5 w-3.5" strokeWidth={2} />
                                        เชื่อมต่อ TikTok
                                    </a>
                                    {tiktokSettings}
                                </div>
                            )
                        }
                    />
                )}

                {platforms.includes("googleAds") && (
                    <PlatformCard
                        name="Google Ads"
                        icon="/icons/google-ads.svg"
                        connected={googleAds.data?.connected ?? false}
                        detail={googleAds.data?.connected ? "Google Ads API" : "ยังไม่ได้เชื่อมต่อ"}
                        description={
                            googleAds.data?.connected
                                ? `ดึงข้อมูลแคมเปญและยอดใช้จ่ายโฆษณาโดยตรงจาก Google Ads API${googleAds.data.lastSyncedAt ? ` · ซิงค์ล่าสุด ${new Date(googleAds.data.lastSyncedAt).toLocaleString("th-TH")}` : ""
                                }`
                                : googleAds.data?.error ?? "ยังไม่ได้เชื่อมต่อ Google Ads กับบัญชีนี้"
                        }
                        action={
                            googleAds.data?.connected ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <RetryButton label="ซิงค์ข้อมูลใหม่" loading={googleAds.loading} onClick={googleAds.refetch} />
                                        <button
                                            onClick={handleGoogleAdsDisconnect}
                                            disabled={disconnectingGoogleAds}
                                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <Unplug className="h-3.5 w-3.5" strokeWidth={2} />
                                            ยกเลิกการเชื่อมต่อ
                                        </button>
                                    </div>
                                    {googleAdsSettings}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <a href="/api/integrations/google-ads/connect"
                                        className="flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                                    >
                                        <PlugZap className="h-3.5 w-3.5" strokeWidth={2} />
                                        เชื่อมต่อ Google Ads
                                    </a>
                                    {googleAdsSettings}
                                </div>
                            )
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
