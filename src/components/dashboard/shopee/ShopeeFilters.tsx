"use client";

import { ShopeeAvailableFilters, ShopeeDashboardFilters } from "@/types/shopeeDashboard";

interface Props {
    filters: ShopeeDashboardFilters;
    availableFilters: ShopeeAvailableFilters;
    onChange: (filters: ShopeeDashboardFilters) => void;
}

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "กำลังทำงาน",
    PAUSED: "หยุด",
};

const selectClassName = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none";

export default function ShopeeFilters({ filters, availableFilters, onChange }: Props) {
    const hasActiveFilters = Boolean(filters.dateFrom || filters.dateTo || filters.productId || filters.campaignName || filters.status);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
                className={selectClassName}
                aria-label="วันที่เริ่มต้น"
            />

            <span className="text-xs text-slate-500">ถึง</span>

            <input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
                className={selectClassName}
                aria-label="วันที่สิ้นสุด"
            />

            <select
                value={filters.productId ?? ""}
                onChange={(e) => onChange({ ...filters, productId: e.target.value || undefined })}
                className={selectClassName}
            >
                <option value="">สินค้าทั้งหมด</option>

                {availableFilters.products.map((product) => (
                    <option key={product.id} value={product.id}>
                        {product.name}
                    </option>
                ))}
            </select>

            <select
                value={filters.campaignName ?? ""}
                onChange={(e) => onChange({ ...filters, campaignName: e.target.value || undefined })}
                className={selectClassName}
            >
                <option value="">แคมเปญทั้งหมด</option>

                {availableFilters.campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.name}>
                        {campaign.name}
                    </option>
                ))}
            </select>

            <select
                value={filters.status ?? ""}
                onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
                className={selectClassName}
            >
                <option value="">สถานะทั้งหมด</option>

                {availableFilters.statuses.map((status) => (
                    <option key={status} value={status}>
                        {STATUS_LABELS[status] ?? status}
                    </option>
                ))}
            </select>

            {hasActiveFilters && (
                <button
                    onClick={() => onChange({})}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                    ล้างตัวกรอง
                </button>
            )}
        </div>
    );
}
