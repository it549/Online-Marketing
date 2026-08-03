import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { clearShopeeCredentials } from "@/server/modules/company/company.repository";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const companyId = await getSelectedCompanyId(request);
        await clearShopeeCredentials(companyId);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ยกเลิกการเชื่อมต่อ Shopee ไม่สำเร็จ" },
            { status: 500 },
        );
    }
}
