import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById, saveTikTokSettings } from "@/server/modules/company/company.repository";

// The secret is never returned: only whether it is set.
export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const company = await getCompanyById(await getSelectedCompanyId(request));
    return NextResponse.json({
        appId: company?.tiktokAppId ?? "",
        hasAppSecret: Boolean(company?.tiktokAppSecret),
    });
}

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => null);
    const appId = String(body?.appId ?? "").trim();
    const appSecret = String(body?.appSecret ?? "").trim();

    try {
        const companyId = await getSelectedCompanyId(request);
        const company = await getCompanyById(companyId);

        if (!appId || (!appSecret && !company?.tiktokAppSecret)) {
            return NextResponse.json({ error: "กรุณากรอก App ID และ App Secret ให้ครบ" }, { status: 400 });
        }

        await saveTikTokSettings(companyId, { appId, appSecret: appSecret || undefined });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to save TikTok settings." },
            { status: 500 },
        );
    }
}
