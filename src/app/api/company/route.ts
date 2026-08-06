import { NextRequest, NextResponse } from "next/server";
import { getCompanyDirectory } from "@/server/modules/company/company.service";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const [companies, selectedCompanyId] = await Promise.all([getCompanyDirectory(), getSelectedCompanyId(request)]);

    return NextResponse.json({
        companies,
        selectedCompanyId: selectedCompanyId.toString(),
    });
}
