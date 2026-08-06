import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { createGoogleAdsAuthorizationUrl } from "@/server/modules/google-ads/googleAdsIntegration.service";

const STATE_COOKIE_NAME = "google_ads_oauth_state";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const state = randomUUID();
    const response = NextResponse.redirect(createGoogleAdsAuthorizationUrl(state));
    response.cookies.set(STATE_COOKIE_NAME, state, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
    });
    return response;
}
