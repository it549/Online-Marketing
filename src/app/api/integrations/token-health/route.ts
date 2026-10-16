import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getFacebookTokenHealth } from "@/server/modules/facebook/facebookTokenHealth.service";

export async function GET(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const tokens = await getFacebookTokenHealth();
        return NextResponse.json({ tokens });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ตรวจสอบ token ไม่สำเร็จ" },
            { status: 500 },
        );
    }
}
