import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import {
    listFacebookAdAccounts,
    selectFacebookAdAccount,
} from "@/server/modules/facebook/facebookIntegration.service";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        return NextResponse.json(await listFacebookAdAccounts(await getSelectedCompanyId(request)));
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load Facebook ad accounts." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const { adAccountId } = (await request.json().catch(() => ({}))) as { adAccountId?: string };
    if (!adAccountId) return NextResponse.json({ error: "adAccountId is required." }, { status: 400 });

    try {
        const updated = await selectFacebookAdAccount(await getSelectedCompanyId(request), adAccountId);
        if (!updated) return NextResponse.json({ error: "Ad account is not accessible." }, { status: 400 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to select Facebook ad account." },
            { status: 500 },
        );
    }
}
