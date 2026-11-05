import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/server/core/auth/api-guard";

export async function GET(request: Request) {
    const session = getSessionFromRequest(request);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ email: session.email, role: session.role });
}
