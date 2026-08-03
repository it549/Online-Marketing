import { NextRequest, NextResponse } from "next/server";
import { generateFacebookInsights } from "@/server/modules/ai-insights/facebookInsights.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const data = await generateFacebookInsights(companyId);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "AI Insights Error" },
            { status: 500 },
        );
    }
}
