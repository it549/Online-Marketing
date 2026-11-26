import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getShopeeProductCosts, saveShopeeProductCosts } from "@/server/modules/company/company.repository";
import { clearShopeePerformanceCache } from "@/server/modules/shopee/shopeeApiPerformance.service";

/** Unit cost per Shopee item_id: {"costs": {"<item_id>": <baht>}}. */
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;
    return NextResponse.json({ costs: await getShopeeProductCosts(await getSelectedCompanyId(request)) });
}

/** Replaces the whole map; a blank/invalid cost removes that product's entry. */
export async function PUT(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const body = (await request.json().catch(() => null)) as { costs?: Record<string, unknown> } | null;
    if (!body?.costs || typeof body.costs !== "object") {
        return NextResponse.json({ error: "ต้องส่ง costs" }, { status: 400 });
    }
    const costs = Object.fromEntries(
        Object.entries(body.costs)
            .filter(([itemId, value]) => /^\d+$/.test(itemId) && typeof value === "number" && Number.isFinite(value) && value >= 0)
            .map(([itemId, value]) => [itemId, Math.round((value as number) * 100) / 100]),
    );

    const companyId = await getSelectedCompanyId(request);
    await saveShopeeProductCosts(companyId, costs);
    // Net profit / Net ROAS are computed from these costs, so cached results are stale now.
    clearShopeePerformanceCache(companyId);
    return NextResponse.json({ costs });
}
