import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById, saveGoogleAdsSettings } from "@/server/modules/company/company.repository";

// Secrets are never returned: only whether they are set.
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const company = await getCompanyById(await getSelectedCompanyId(request));
    return NextResponse.json({
        clientId: company?.googleAdsClientId ?? "",
        customerId: company?.googleAdsCustomerId ?? "",
        loginCustomerId: company?.googleAdsLoginCustomerId ?? "",
        hasClientSecret: Boolean(company?.googleAdsClientSecret),
        hasDeveloperToken: Boolean(company?.googleAdsDeveloperToken),
    });
}

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => null);
    const clientId = String(body?.clientId ?? "").trim();
    const clientSecret = String(body?.clientSecret ?? "").trim();
    const developerToken = String(body?.developerToken ?? "").trim();
    const customerId = String(body?.customerId ?? "").replace(/\D/g, "");
    const loginCustomerId = String(body?.loginCustomerId ?? "").replace(/\D/g, "");

    try {
        const companyId = await getSelectedCompanyId(request);
        const company = await getCompanyById(companyId);

        if (!clientId || (!clientSecret && !company?.googleAdsClientSecret) || (!developerToken && !company?.googleAdsDeveloperToken)) {
            return NextResponse.json({ error: "กรุณากรอก Client ID, Client Secret และ Developer Token ให้ครบ" }, { status: 400 });
        }

        await saveGoogleAdsSettings(companyId, {
            clientId,
            clientSecret: clientSecret || undefined,
            developerToken: developerToken || undefined,
            customerId: customerId || null,
            loginCustomerId: loginCustomerId || null,
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to save Google Ads settings." },
            { status: 500 },
        );
    }
}
