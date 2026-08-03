import { NextRequest } from "next/server";
import { listCompanies } from "@/server/modules/company/company.repository";

export const SELECTED_COMPANY_COOKIE = "selected_company_id";

/** Reads the caller's selected company from a cookie, falling back to the first company if unset/invalid. */
export async function getSelectedCompanyId(request: NextRequest): Promise<bigint> {
    const raw = request.cookies.get(SELECTED_COMPANY_COOKIE)?.value;

    if (raw) {
        try {
            return BigInt(raw);
        } catch {
            // fall through to default
        }
    }

    const companies = await listCompanies();

    if (companies.length === 0) {
        throw new Error("No companies configured");
    }

    return companies[0].id;
}
