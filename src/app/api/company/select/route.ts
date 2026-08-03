import { NextRequest, NextResponse } from "next/server";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { SELECTED_COMPANY_COOKIE } from "@/server/core/company/selectedCompany";
import { requireAdmin } from "@/server/core/auth/api-guard";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    try {
        const body = await request.json();
        const companyId = typeof body.companyId === "string" ? body.companyId : "";

        if (!companyId) {
            return NextResponse.json({ error: "companyId is required" }, { status: 400 });
        }

        const company = await getCompanyById(BigInt(companyId));

        if (!company) {
            return NextResponse.json({ error: "ไม่พบบริษัทนี้" }, { status: 404 });
        }

        const response = NextResponse.json({ success: true });

        response.cookies.set(SELECTED_COMPANY_COOKIE, company.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: ONE_YEAR_SECONDS,
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "เลือกบริษัทไม่สำเร็จ" },
            { status: 500 },
        );
    }
}
