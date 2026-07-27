import { NextRequest, NextResponse } from "next/server";
import { getCampaigns } from "@/server/modules/campaigns/campaigns.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const data = await getCampaigns(companyId);

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Campaigns Error" },
            { status: 500 },
        );
    }
}
