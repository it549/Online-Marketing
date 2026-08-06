import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getLeads } from "@/server/modules/insights/insights.service";
import type { CompanyPlatformId } from "@/types/company";

const VALID_PLATFORMS: readonly CompanyPlatformId[] = ["facebook", "shopee", "tiktok", "googleAds"];

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const platformParam = request.nextUrl.searchParams.get("platform");
    const dateFromParam = request.nextUrl.searchParams.get("dateFrom");
    const dateToParam = request.nextUrl.searchParams.get("dateTo");

    if (platformParam && !VALID_PLATFORMS.includes(platformParam as CompanyPlatformId)) {
        return NextResponse.json({ error: "platform ไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        const data = await getLeads(
            companyId,
            (platformParam as CompanyPlatformId | null) ?? undefined,
            dateFromParam ? new Date(dateFromParam) : undefined,
            dateToParam ? new Date(dateToParam) : undefined,
        );
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Insights Leads Error" },
            { status: 500 },
        );
    }
}
