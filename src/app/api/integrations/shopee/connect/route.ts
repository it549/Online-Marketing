import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { getShopeeAuthorizationUrlForCompany } from "@/server/modules/shopee/shopeeAuth.service";
import { hasSeparateShopeeAdsApp } from "@/server/modules/shopee/shopeeSign";

/** Kicks off the Shopee OAuth handshake: redirects the browser to Shopee's shop-authorization page. */
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const fail = (message: string) => {
        const url = absoluteUrl("/", request);
        url.searchParams.set("view", "integrations");
        url.searchParams.set("shopee", "error");
        url.searchParams.set("message", message);
        return NextResponse.redirect(url);
    };

    // ?app=ads authorizes the shop to the separate Ads Service app (SHOPEE_ADS_PARTNER_ID/KEY).
    const app = request.nextUrl.searchParams.get("app") === "ads" ? "ads" : "main";
    if (app === "ads" && !hasSeparateShopeeAdsApp()) {
        return fail("ยังไม่ได้ตั้งค่าแอป Shopee Ads (SHOPEE_ADS_PARTNER_ID / SHOPEE_ADS_PARTNER_KEY) บนเซิร์ฟเวอร์");
    }

    const companyId = await getSelectedCompanyId(request);
    const authorizationUrl = await getShopeeAuthorizationUrlForCompany(companyId, app);

    if (!authorizationUrl) return fail("บริษัทนี้ไม่ได้เปิดใช้งาน Shopee");

    return NextResponse.redirect(authorizationUrl);
}
