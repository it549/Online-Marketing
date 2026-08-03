import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { parseCompanyPlatforms } from "@/server/modules/company/companyPlatforms";
import { buildShopeeAuthUrl } from "@/server/modules/shopee/shopeeAuth.service";

/** Kicks off the Shopee OAuth handshake: redirects the browser to Shopee's shop-authorization page. */
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const companyId = await getSelectedCompanyId(request);
    const company = await getCompanyById(companyId);

    if (!company || !parseCompanyPlatforms(company.platforms).includes("shopee")) {
        const url = absoluteUrl("/", request);
        url.searchParams.set("view", "integrations");
        url.searchParams.set("shopee", "error");
        url.searchParams.set("message", "บริษัทนี้ไม่ได้เปิดใช้งาน Shopee");
        return NextResponse.redirect(url);
    }

    return NextResponse.redirect(buildShopeeAuthUrl());
}
