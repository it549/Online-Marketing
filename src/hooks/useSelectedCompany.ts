"use client";

import { useEffect, useState } from "react";
import type { CompanyPlatformId } from "@/types/company";

export interface SelectedCompany {
    id: string;
    name: string;
    code: string;
    platforms: CompanyPlatformId[];
}

export function useSelectedCompany() {
    const [company, setCompany] = useState<SelectedCompany | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/company")
            .then((res) => res.json())
            .then((data) => {
                const companies: SelectedCompany[] = data.companies ?? [];
                const selected = companies.find((c) => c.id === data.selectedCompanyId) ?? null;
                setCompany(selected);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { company, loading };
}
