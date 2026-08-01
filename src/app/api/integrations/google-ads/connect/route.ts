import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { config } from "@/server/configurations/config";

const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const STATE_COOKIE_NAME = "google_ads_oauth_state";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    // random nonce ป้องกัน CSRF — เก็บใน httpOnly cookie แล้วเช็คตอน callback
    const state = randomUUID();

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", config.google.clientID);
    authUrl.searchParams.set("redirect_uri", config.google.redirectUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_ADS_SCOPE);
    authUrl.searchParams.set("access_type", "offline"); // จำเป็น เพื่อให้ได้ refresh_token
    authUrl.searchParams.set("prompt", "consent"); // บังคับขอ consent ใหม่ทุกครั้ง เพื่อให้ได้ refresh_token แน่นอน
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set(STATE_COOKIE_NAME, state, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 10, // 10 นาที
        path: "/",
    });

    return response;
}