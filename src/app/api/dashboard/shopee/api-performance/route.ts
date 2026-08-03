import { NextRequest, NextResponse } from "next/server";
import { getShopeeApiPerformance, ShopeeCredentials } from "@/server/modules/shopee/shopeeApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById } from "@/server/modules/company/company.repository";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        const company = await getCompanyById(companyId);

        const credentials: ShopeeCredentials | null =
            company?.shopeeShopId && company?.shopeeAccessToken && company?.shopeeRefreshToken
                ? {
                      companyId,
                      shopId: company.shopeeShopId,
                      accessToken: company.shopeeAccessToken,
                      refreshToken: company.shopeeRefreshToken,
                      expiresAt: company.shopeeTokenExpiresAt,
                  }
                : null;

        const data = await getShopeeApiPerformance(credentials);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Shopee API Performance Error" },
            { status: 500 },
        );
    }
}
