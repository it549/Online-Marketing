import { NextRequest, NextResponse } from "next/server";
import { getShopeeApiPerformance } from "@/server/modules/shopee/shopeeApiPerformance.service";
import { requireAdmin } from "@/server/core/auth/api-guard";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const data = await getShopeeApiPerformance();
    return NextResponse.json(data);
}
