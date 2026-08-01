import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { clearGoogleAdsConnection } from "@/server/modules/company/company.repository";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        await clearGoogleAdsConnection(companyId);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ" },
            { status: 500 }
        );
    }
}