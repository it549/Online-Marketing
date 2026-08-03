import { NextRequest, NextResponse } from "next/server";
import { getOverview } from "@/server/modules/overview/overview.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const data = await getOverview(companyId);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Overview Error" },
            { status: 500 },
        );
    }
}
