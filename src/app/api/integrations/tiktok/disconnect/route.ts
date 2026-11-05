import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { disconnectTikTokAccount } from "@/server/modules/tiktok/tiktokIntegration.service";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        await disconnectTikTokAccount(await getSelectedCompanyId(request));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to disconnect TikTok." },
            { status: 500 },
        );
    }
}
