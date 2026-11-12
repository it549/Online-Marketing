"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import DashboardLoading from "../DashboardLoading";
import DashboardError from "../DashboardError";
import { ShopeeProductsResponse } from "@/types/shopeeProducts";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    NORMAL: { label: "ขายอยู่", className: "bg-emerald-50 text-emerald-700" },
    UNLIST: { label: "ซ่อนอยู่", className: "bg-slate-100 text-slate-600" },
    BANNED: { label: "ถูกระงับ", className: "bg-rose-50 text-rose-700" },
};

function formatNumber(value: number | null): string {
    return value === null ? "-" : value.toLocaleString();
}

export default function ShopeeProducts() {
    const [data, setData] = useState<ShopeeProductsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const load = useCallback(async (force: boolean) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/shopee/products${force ? "?refresh=1" : ""}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error ?? "เกิดข้อผิดพลาด");
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() => load(false));
    }, [load]);

    const products = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        const list = data?.products ?? [];
        if (!keyword) return list;
        return list.filter((p) => p.name.toLowerCase().includes(keyword) || (p.sku ?? "").toLowerCase().includes(keyword));
    }, [data, query]);

    const counts = useMemo(() => {
        const list = data?.products ?? [];
        return { total: list.length, selling: list.filter((p) => p.status === "NORMAL").length };
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">
                    {data?.connected && (
                        <>
                            สินค้าทั้งหมด <span className="font-semibold text-slate-900">{counts.total.toLocaleString()}</span> รายการ · ขายอยู่{" "}
                            <span className="font-semibold text-emerald-600">{counts.selling.toLocaleString()}</span>
                            {data.lastSyncedAt && <> · อัปเดตล่าสุด {new Date(data.lastSyncedAt).toLocaleString("th-TH")}</>}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ค้นหาชื่อสินค้า / SKU"
                            className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={() => load(true)}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
                        รีเฟรช
                    </button>
                </div>
            </div>

            {loading && !data && <DashboardLoading />}

            {error && <DashboardError message={error} />}

            {data && !data.connected && <DashboardError message={data.error ?? "ดึงรายการสินค้าจาก Shopee ไม่สำเร็จ"} />}

            {data?.connected && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                                <th className="px-5 py-3 text-left">สินค้า</th>
                                <th className="px-5 py-3 text-center">สถานะ</th>
                                <th className="px-5 py-3 text-right">ราคา</th>
                                <th className="px-5 py-3 text-right">สต็อก</th>
                                <th className="px-5 py-3 text-right">ขายแล้ว</th>
                                <th className="px-5 py-3 text-right">ยอดเข้าชม</th>
                                <th className="px-5 py-3 text-right">ถูกใจ</th>
                                <th className="px-5 py-3 text-right">คะแนน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const status = STATUS_LABEL[product.status] ?? { label: product.status, className: "bg-slate-100 text-slate-600" };
                                return (
                                    <tr key={product.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                                    {product.imageUrl && (
                                                        // Shopee CDN image; not worth whitelisting via next/image remotePatterns.
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="line-clamp-2 font-medium text-slate-900">{product.name}</div>
                                                    {product.sku && <div className="text-xs text-slate-400">SKU: {product.sku}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-700">
                                            {product.price !== null ? (
                                                <>
                                                    ฿{product.price.toLocaleString()}
                                                    {product.originalPrice !== null && product.originalPrice > product.price && (
                                                        <div className="text-xs text-slate-400 line-through">฿{product.originalPrice.toLocaleString()}</div>
                                                    )}
                                                </>
                                            ) : product.hasVariations ? (
                                                <span className="text-xs text-slate-400">หลายตัวเลือก</span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className={`px-5 py-3 text-right ${product.stock === 0 ? "font-semibold text-rose-600" : "text-slate-700"}`}>
                                            {formatNumber(product.stock)}
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-700">{formatNumber(product.sold)}</td>
                                        <td className="px-5 py-3 text-right text-slate-700">{formatNumber(product.views)}</td>
                                        <td className="px-5 py-3 text-right text-slate-700">{formatNumber(product.likes)}</td>
                                        <td className="px-5 py-3 text-right text-slate-700">{product.rating ? product.rating.toFixed(1) : "-"}</td>
                                    </tr>
                                );
                            })}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                                        {query ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้าในร้าน"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
