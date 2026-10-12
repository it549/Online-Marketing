import { NextResponse } from "next/server";
import { InvalidCredentialsError, login } from "@/server/core/auth/auth.service";
import { clearLoginFailures, getLoginKeys, getRetryAfterSeconds, recordLoginFailure } from "@/server/core/auth/loginRateLimit";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/server/core/auth/session";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!email || !password) {
            return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
        }

        const { ipKey, emailKey } = getLoginKeys(request, email);
        const retryAfter = getRetryAfterSeconds([ipKey, emailKey]);
        if (retryAfter > 0) {
            return NextResponse.json(
                { error: "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง" },
                { status: 429, headers: { "Retry-After": String(retryAfter) } },
            );
        }

        const { token, role } = await login(email, password).catch((error) => {
            if (error instanceof InvalidCredentialsError) recordLoginFailure([ipKey, emailKey]);
            throw error;
        });
        clearLoginFailures([emailKey]);

        const response = NextResponse.json({ success: true, user: { email, role } });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_MAX_AGE_SECONDS,
        });

        return response;
    } catch (error) {
        if (error instanceof InvalidCredentialsError) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        console.error("Login Error:", error);
        return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
    }
}
