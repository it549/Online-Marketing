import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById, updateGoogleAdsAppCredentials } from "@/server/modules/company/company.repository";

// Never returns the client secret or developer token -- only whether each is set for this company.
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const company = await getCompanyById(await getSelectedCompanyId(request));
    return NextResponse.json({
        clientId: company?.googleAdsClientId ?? "",
        loginCustomerId: company?.googleAdsLoginCustomerId ?? "",
        hasClientSecret: !!company?.googleAdsClientSecret,
        hasDeveloperToken: !!company?.googleAdsDeveloperToken,
    });
}

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => null);
    const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

    const loginCustomerId = text(body?.loginCustomerId).replace(/-/g, "");
    if (loginCustomerId && !/^\d{10}$/.test(loginCustomerId)) {
        return NextResponse.json({ error: "MCC ID ต้องเป็นตัวเลข 10 หลัก" }, { status: 400 });
    }

    try {
        await updateGoogleAdsAppCredentials(await getSelectedCompanyId(request), {
            clientId: text(body?.clientId),
            loginCustomerId,
            clientSecret: text(body?.clientSecret),
            developerToken: text(body?.developerToken),
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to save Google Ads credentials." },
            { status: 500 },
        );
    }
}
