import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/core/auth/session";
import { absoluteUrl } from "@/server/core/http/appUrl";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

// OAuth provider callbacks are top-level browser navigations, not fetch calls from our own
// frontend -- on missing/expired session they must redirect (like a page route) instead of
// returning raw JSON, since there's no frontend code around to read that JSON.
const OAUTH_CALLBACK_PATHS = ["/api/integrations/shopee/callback"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (PUBLIC_PATHS.includes(pathname)) {
        return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    const isApiRoute = pathname.startsWith("/api") && !OAUTH_CALLBACK_PATHS.includes(pathname);

    if (!session) {
        if (isApiRoute) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(absoluteUrl("/login", request));
    }

    if (session.role !== "ADMIN") {
        if (isApiRoute) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (pathname !== "/forbidden") {
            return NextResponse.redirect(absoluteUrl("/forbidden", request));
        }
    }

    return NextResponse.next();
}

export const config = {
    // Static assets (icons/logos served from /public) must stay reachable without a
    // session -- Next's image optimizer fetches them internally to resize/transform,
    // and that internal fetch carries no session cookie, so gating them here made
    // next/image fail for any raster (non-SVG) image with "not a valid image".
    matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
