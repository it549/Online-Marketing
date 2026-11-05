import { NextRequest, NextResponse } from "next/server";
import { getTikTokApiPerformanceForCompany } from "@/server/modules/tiktok/tiktokApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const data = await getTikTokApiPerformanceForCompany(await getSelectedCompanyId(request));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "TikTok API Performance Error" },
            { status: 500 },
        );
    }
}
