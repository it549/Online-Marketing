import { NextRequest, NextResponse } from "next/server";
import { generateShopeeInsights } from "@/server/modules/ai-insights/shopeeInsights.service";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const data = await generateShopeeInsights();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "AI Insights Error" },
            { status: 500 },
        );
    }
}
