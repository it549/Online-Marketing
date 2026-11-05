import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getAudienceBreakdown } from "@/server/modules/insights/insights.service";
import type { CompanyPlatformId } from "@/types/company";
import type { BreakdownDimension } from "@/types/insights";

const VALID_PLATFORMS: readonly CompanyPlatformId[] = ["facebook", "shopee", "tiktok", "googleAds"];
const VALID_DIMENSIONS: readonly BreakdownDimension[] = ["AGE", "GENDER", "REGION", "PUBLISHER_PLATFORM", "PLATFORM_POSITION"];

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const platform = request.nextUrl.searchParams.get("platform") as CompanyPlatformId | null;
    const dimension = request.nextUrl.searchParams.get("dimension") as BreakdownDimension | null;
    const dateFromParam = request.nextUrl.searchParams.get("dateFrom");
    const dateToParam = request.nextUrl.searchParams.get("dateTo");

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
        return NextResponse.json({ error: "platform ไม่ถูกต้อง" }, { status: 400 });
    }

    if (!dimension || !VALID_DIMENSIONS.includes(dimension)) {
        return NextResponse.json({ error: "dimension ไม่ถูกต้อง" }, { status: 400 });
    }

    if (!dateFromParam || !dateToParam) {
        return NextResponse.json({ error: "ต้องระบุ dateFrom และ dateTo" }, { status: 400 });
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        const data = await getAudienceBreakdown(companyId, platform, dimension, new Date(dateFromParam), new Date(dateToParam));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Insights Breakdown Error" },
            { status: 500 },
        );
    }
}
