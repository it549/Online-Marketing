import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getOverviewInsight } from "@/server/modules/overview/overview.service";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const dateFromParam = request.nextUrl.searchParams.get("dateFrom");
    const dateToParam = request.nextUrl.searchParams.get("dateTo");

    if (!dateFromParam || !dateToParam) {
        return NextResponse.json({ error: "ต้องระบุ dateFrom และ dateTo" }, { status: 400 });
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        const data = await getOverviewInsight(companyId, new Date(dateFromParam), new Date(dateToParam));
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Overview Insight Error" },
            { status: 500 },
        );
    }
}
