import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SessionPayload, verifySessionToken } from "./session";

function parseCookies(header: string | null): Record<string, string> {
    if (!header) return {};

    return Object.fromEntries(
        header
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const separatorIndex = part.indexOf("=");
                if (separatorIndex === -1) return [part, ""];
                const key = part.slice(0, separatorIndex);
                const value = part.slice(separatorIndex + 1);
                return [key, decodeURIComponent(value)];
            }),
    );
}

export function getSessionFromRequest(request: Request): SessionPayload | null {
    const cookies = parseCookies(request.headers.get("cookie"));
    return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

export type AdminGuardResult = { session: SessionPayload; response?: undefined } | { session?: undefined; response: NextResponse };

export function requireAdmin(request: Request): AdminGuardResult {
    const session = getSessionFromRequest(request);

    if (!session) {
        return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    if (session.role !== "ADMIN") {
        return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { session };
}
