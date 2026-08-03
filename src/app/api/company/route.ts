import { NextRequest, NextResponse } from "next/server";
import { listCompanies } from "@/server/modules/company/company.repository";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const [companies, selectedCompanyId] = await Promise.all([listCompanies(), getSelectedCompanyId(request)]);

    return NextResponse.json({
        companies: companies.map((company) => ({
            id: company.id.toString(),
            name: company.name,
            code: company.code,
            platforms: parseCompanyPlatforms(company.platforms),
        })),
        selectedCompanyId: selectedCompanyId.toString(),
    });
}
