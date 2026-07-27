import { NextRequest, NextResponse } from "next/server";
import { getGoogleAdsApiPerformance } from "@/server/modules/google-ads/googleAdsApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById } from "@/server/modules/company/company.repository";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const company = await getCompanyById(companyId);

        const credentials =
            company?.googleAdsCustomerId && company?.googleAdsRefreshToken
                ? { customerId: company.googleAdsCustomerId, refreshToken: company.googleAdsRefreshToken }
                : null;

        const data = await getGoogleAdsApiPerformance(credentials);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Google Ads API Performance Error" },
            { status: 500 },
        );
    }
}
