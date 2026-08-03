import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { saveShopeeCredentials } from "@/server/modules/company/company.repository";
import { exchangeShopeeCode } from "@/server/modules/shopee/shopeeAuth.service";

function redirectToIntegrations(request: NextRequest, status: "connected" | "error", message?: string) {
    const url = absoluteUrl("/", request);
    url.searchParams.set("view", "integrations");
    url.searchParams.set("shopee", status);
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url);
}

/**
 * Shopee redirects the user's browser here after they authorize the shop. This is a
 * top-level navigation (not a fetch call from our own frontend), so failures must
 * redirect back into the app with a readable reason rather than return raw JSON.
 */
export async function GET(request: NextRequest) {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.redirect(absoluteUrl("/login", request));

    const code = request.nextUrl.searchParams.get("code");
    const shopId = request.nextUrl.searchParams.get("shop_id");

    if (!code || !shopId) {
        return redirectToIntegrations(request, "error", "Shopee ไม่ได้ส่ง code หรือ shop_id กลับมา กรุณาลองเชื่อมต่อใหม่อีกครั้ง");
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        const token = await exchangeShopeeCode(code, shopId);

        await saveShopeeCredentials(companyId, token);

        return redirectToIntegrations(request, "connected");
    } catch (error) {
        return redirectToIntegrations(request, "error", error instanceof Error ? error.message : "เชื่อมต่อ Shopee ไม่สำเร็จ");
    }
}
