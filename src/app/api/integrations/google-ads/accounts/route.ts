import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { listGoogleAdsAccounts, selectGoogleAdsAccount } from "@/server/modules/google-ads/googleAdsIntegration.service";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        return NextResponse.json(await listGoogleAdsAccounts(await getSelectedCompanyId(request)));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load Google Ads accounts." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => null);
    const customerId = typeof body?.customerId === "string" ? body.customerId : "";
    if (!/^\d{10}$/.test(customerId)) {
        return NextResponse.json({ error: "Invalid customerId." }, { status: 400 });
    }

    try {
        await selectGoogleAdsAccount(await getSelectedCompanyId(request), customerId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to select Google Ads account." },
            { status: 400 },
        );
    }
}
