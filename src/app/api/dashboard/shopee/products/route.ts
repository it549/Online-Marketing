import { NextRequest, NextResponse } from "next/server";
import { getShopeeProductsForCompany } from "@/server/modules/shopee/shopeeProducts.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const force = request.nextUrl.searchParams.get("refresh") === "1";
        const data = await getShopeeProductsForCompany(await getSelectedCompanyId(request), force);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Shopee Products Error" },
            { status: 500 },
        );
    }
}
