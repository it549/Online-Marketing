import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { disconnectShopeeAccount } from "@/server/modules/shopee/shopeeAuth.service";

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        await disconnectShopeeAccount(await getSelectedCompanyId(request));
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ยกเลิกการเชื่อมต่อ Shopee ไม่สำเร็จ" },
            { status: 500 },
        );
    }
}
