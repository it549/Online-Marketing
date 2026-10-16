import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { connectGoogleAdsAccount } from "@/server/modules/google-ads/googleAdsIntegration.service";

const STATE_COOKIE_NAME = "google_ads_oauth_state";

function redirectWithBanner(request: NextRequest, status: "connected" | "error", message?: string) {
    const url = absoluteUrl("/", request);
    url.searchParams.set("view", "integrations");
    url.searchParams.set("googleAds", status);
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const savedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
    if (request.nextUrl.searchParams.get("error")) {
        return redirectWithBanner(request, "error", "Google authorization was declined.");
    }
    if (!code || !state || !savedState || state !== savedState) {
        return redirectWithBanner(request, "error", "The Google Ads connection request is invalid or has expired.");
    }

    try {
        const result = await connectGoogleAdsAccount(await getSelectedCompanyId(request), code);
        if (!result.ok) return redirectWithBanner(request, "error", result.message);

        const message = result.customerCount > 1
            ? `Connected to ${result.customerId}; ${result.customerCount} accounts are available.`
            : "Google Ads connected successfully.";
        const response = redirectWithBanner(request, "connected", message);
        response.cookies.delete(STATE_COOKIE_NAME);
        return response;
    } catch (error) {
        console.error("Google Ads OAuth callback error:", error);
        return redirectWithBanner(request, "error", "Google Ads could not be connected.");
    }
}
