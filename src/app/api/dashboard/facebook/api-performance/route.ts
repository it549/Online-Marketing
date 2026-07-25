import { NextRequest, NextResponse } from "next/server";
import { getFacebookApiPerformance } from "@/server/modules/facebook/facebookApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const data = await getFacebookApiPerformance();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Facebook API Performance Error" },
            { status: 500 },
        );
    }
}
