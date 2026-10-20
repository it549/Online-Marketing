import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { absoluteUrl } from "@/server/core/http/appUrl";
import { createTikTokAuthorizationUrl } from "@/server/modules/tiktok/tiktokIntegration.service";

const STATE_COOKIE_NAME = "tiktok_oauth_state";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const state = randomUUID();
        const response = NextResponse.redirect(
            await createTikTokAuthorizationUrl(await getSelectedCompanyId(request), state),
        );
        response.cookies.set(STATE_COOKIE_NAME, state, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 10,
            path: "/",
        });
        return response;
    } catch (error) {
        const url = absoluteUrl("/", request);
        url.searchParams.set("view", "integrations");
        url.searchParams.set("tiktok", "error");
        url.searchParams.set("message", error instanceof Error ? error.message : "TikTok could not be connected.");
        return NextResponse.redirect(url);
    }
}
