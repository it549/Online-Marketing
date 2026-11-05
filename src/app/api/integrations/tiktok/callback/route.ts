import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { connectTikTokAccount } from "@/server/modules/tiktok/tiktokIntegration.service";

const STATE_COOKIE_NAME = "tiktok_oauth_state";

function redirectWithBanner(request: NextRequest, status: "connected" | "error", message?: string) {
    const url = absoluteUrl("/", request);
    url.searchParams.set("view", "integrations");
    url.searchParams.set("tiktok", status);
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const authCode = request.nextUrl.searchParams.get("auth_code") ?? request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const savedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
    if (!authCode || !state || !savedState || state !== savedState) {
        return redirectWithBanner(request, "error", "The TikTok connection request is invalid or has expired.");
    }

    try {
        const result = await connectTikTokAccount(await getSelectedCompanyId(request), authCode);
        if (!result.ok) return redirectWithBanner(request, "error", result.message);

        const message = result.advertiserCount > 1
            ? `Connected to ${result.advertiserId}; ${result.advertiserCount} accounts are available.`
            : "TikTok connected successfully.";
        const response = redirectWithBanner(request, "connected", message);
        response.cookies.delete(STATE_COOKIE_NAME);
        return response;
    } catch (error) {
        console.error("TikTok OAuth callback error:", error);
        return redirectWithBanner(request, "error", "TikTok could not be connected.");
    }
}
