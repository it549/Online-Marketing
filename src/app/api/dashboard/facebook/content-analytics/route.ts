import { NextRequest, NextResponse } from "next/server";
import { getFacebookContentAnalytics } from "@/server/modules/facebook-content/facebookContentAnalytics.service";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const importJobId = request.nextUrl.searchParams.get("importJobId") ?? undefined;
        const data = await getFacebookContentAnalytics(importJobId);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Facebook Content Analytics Error" },
            { status: 500 },
        );
    }
}
