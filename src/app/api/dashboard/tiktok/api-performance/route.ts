import { NextRequest, NextResponse } from "next/server";
import { getTikTokApiPerformance } from "@/server/modules/tiktok/tiktokApiPerformance.service";
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
            company?.tiktokAdvertiserId && company?.tiktokAccessToken
                ? { advertiserId: company.tiktokAdvertiserId, accessToken: company.tiktokAccessToken }
                : null;

        const data = await getTikTokApiPerformance(credentials);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "TikTok API Performance Error" },
            { status: 500 },
        );
    }
}
