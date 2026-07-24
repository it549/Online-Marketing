import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/core/auth/session";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (PUBLIC_PATHS.includes(pathname)) {
        return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    const isApiRoute = pathname.startsWith("/api");

    if (!session) {
        if (isApiRoute) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.role !== "ADMIN") {
        if (isApiRoute) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (pathname !== "/forbidden") {
            return NextResponse.redirect(new URL("/forbidden", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
