import { getCompanyById, listCompanies } from "./company.repository";
import { parseCompanyPlatforms } from "./companyPlatforms";
import type { CompanyPlatformId } from "@/types/company";

export async function getCompanyDirectory() {
    const companies = await listCompanies();
    return companies.map((company) => ({
        id: company.id.toString(),
        name: company.name,
        code: company.code,
        platforms: parseCompanyPlatforms(company.platforms),
    }));
}

export async function requireCompany(companyId: bigint) {
    const company = await getCompanyById(companyId);
    if (!company) throw new Error("Company not found");
    return company;
}

export async function isPlatformEnabled(companyId: bigint, platform: CompanyPlatformId): Promise<boolean> {
    const company = await getCompanyById(companyId);
    return Boolean(company && parseCompanyPlatforms(company.platforms).includes(platform));
}
