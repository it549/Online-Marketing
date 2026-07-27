import { NextRequest, NextResponse } from "next/server";
import { getFacebookApiPerformance } from "@/server/modules/facebook/facebookApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById } from "@/server/modules/company/company.repository";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const company = await getCompanyById(companyId);

        const credentials = company?.facebookAdAccountId && company?.facebookAccessToken
            ? { adAccountId: company.facebookAdAccountId, accessToken: company.facebookAccessToken }
            : null;

        const data = await getFacebookApiPerformance(credentials);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Facebook API Performance Error" },
            { status: 500 },
        );
    }
}
