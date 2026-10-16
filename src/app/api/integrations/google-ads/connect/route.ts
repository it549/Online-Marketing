import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE } from "@/server/modules/google-ads/client";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { createGoogleAdsAuthorizationUrl } from "@/server/modules/google-ads/googleAdsIntegration.service";

const STATE_COOKIE_NAME = "google_ads_oauth_state";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const state = randomUUID();
    const company = await getCompanyById(await getSelectedCompanyId(request));
    const authorizationUrl = createGoogleAdsAuthorizationUrl(state, company);
    if (!authorizationUrl) {
        const url = absoluteUrl("/", request);
        url.searchParams.set("view", "integrations");
        url.searchParams.set("googleAds", "error");
        url.searchParams.set("message", GOOGLE_ADS_APP_NOT_CONFIGURED_MESSAGE);
        return NextResponse.redirect(url);
    }
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(STATE_COOKIE_NAME, state, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
    });
    return response;
}
