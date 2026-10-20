import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { connectFacebookAccount } from "@/server/modules/facebook/facebookIntegration.service";

const STATE_COOKIE_NAME = "facebook_oauth_state";

function redirectWithBanner(request: NextRequest, status: "connected" | "error", message?: string) {
    const url = absoluteUrl("/", request);
    url.searchParams.set("view", "integrations");
    url.searchParams.set("facebook", status);
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
        return redirectWithBanner(request, "error", "Facebook authorization was declined.");
    }
    if (!code || !state || !savedState || state !== savedState) {
        return redirectWithBanner(request, "error", "The Facebook connection request is invalid or has expired.");
    }

    try {
        const result = await connectFacebookAccount(await getSelectedCompanyId(request), code);
        if (!result.ok) return redirectWithBanner(request, "error", result.message);

        const message = result.accountCount > 1
            ? `Connected to ${result.accountName}; ${result.accountCount} accounts are available.`
            : "Facebook connected successfully.";
        const response = redirectWithBanner(request, "connected", message);
        response.cookies.delete(STATE_COOKIE_NAME);
        return response;
    } catch (error) {
        console.error("Facebook OAuth callback error:", error);
        return redirectWithBanner(request, "error", "Facebook could not be connected.");
    }
}
