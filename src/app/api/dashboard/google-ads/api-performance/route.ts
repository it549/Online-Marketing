import { NextRequest, NextResponse } from "next/server";
import { getGoogleAdsApiPerformanceForCompany } from "@/server/modules/google-ads/googleAds.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const data = await getGoogleAdsApiPerformanceForCompany(await getSelectedCompanyId(request));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Google Ads API Performance Error" },
            { status: 500 },
        );
    }
}
