"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";

interface Company {
    id: string;
    name: string;
    code: string;
}

const LOGO_BY_CODE: Record<string, string> = {
    rungsiyo: "/icons/rungsiyo_logo.png",
    "company-2": "/icons/nilaphatra_logo.webp",
};

const BADGE_COLORS = [
    "from-indigo-500 to-purple-500",
    "from-orange-500 to-red-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
];

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    return hash;
}

/** Falls back to a stable colored-initials badge (same convention as the user avatar) when there's no logo, or it fails to load/render (e.g. an empty SVG). */
function CompanyBadge({ company, size = "sm" }: { company: Company; size?: "sm" | "md" }) {
    const logo = LOGO_BY_CODE[company.code];
    const [logoFailed, setLogoFailed] = useState(false);
    const sizeClass = size === "md" ? "h-9 w-9" : "h-8 w-8";

    if (logo && !logoFailed) {
        return (
            <div className={`flex shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white p-1 ${sizeClass}`}>
                <Image
                    src={logo}
                    alt={company.name}
                    width={size === "md" ? 28 : 24}
                    height={size === "md" ? 28 : 24}
                    className="h-full w-full object-contain"
                    onError={() => setLogoFailed(true)}
                />
            </div>
        );
    }

    const initials = company.name.slice(0, 2).toUpperCase();
    const color = BADGE_COLORS[hashString(company.code) % BADGE_COLORS.length];

    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} font-semibold text-white ${
                size === "md" ? "text-xs" : "text-[10px]"
            } ${sizeClass}`}
        >
            {initials}
        </div>
    );
}

export default function CompanySwitcher() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/company")
            .then((res) => res.json())
            .then((data) => {
                setCompanies(data.companies ?? []);
                setSelectedId(data.selectedCompanyId ?? null);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleSelect(companyId: string) {
        if (companyId === selectedId || switching) return;

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

    const selectedCompany = companies.find((c) => c.id === selectedId);

    if (companies.length === 0) return null;

    return (
        <div className="relative border-b border-slate-100 px-3 py-3" ref={containerRef}>
            <button
                onClick={() => setOpen((v) => !v)}
                disabled={switching}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
                {selectedCompany && <CompanyBadge company={selectedCompany} size="md" />}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-slate-900">{selectedCompany?.name ?? "..."}</p>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                            ผู้ดูแลระบบ
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400">สลับบริษัท</p>
                </div>

                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>

            {open && (
                <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {companies.map((company) => (
                        <button
                            key={company.id}
                            onClick={() => handleSelect(company.id)}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <CompanyBadge company={company} />
                            <span className="flex-1 truncate">{company.name}</span>
                            {company.id === selectedId && <Check className="h-4 w-4 text-indigo-600" strokeWidth={2} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
