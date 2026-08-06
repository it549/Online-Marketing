import { NextRequest, NextResponse } from "next/server";
import { getShopeeApiPerformanceForCompany } from "@/server/modules/shopee/shopeeApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const data = await getShopeeApiPerformanceForCompany(await getSelectedCompanyId(request));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Shopee API Performance Error" },
            { status: 500 },
        );
    }
}
