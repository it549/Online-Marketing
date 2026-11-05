import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/core/auth/api-guard";
import { getSelectedCompanyId } from "@/server/core/company/selectedCompany";
import { getCompanyById } from "@/server/modules/company/company.repository";
import { runManualEtlSync } from "@/server/core/etl/etlOrchestrator.service";
import { getTodayInBangkok, getYesterdayInBangkok } from "@/server/core/etl/etlDate.util";
import type { CompanyPlatformId } from "@/types/company";

const VALID_PLATFORMS: readonly CompanyPlatformId[] = ["facebook", "shopee", "tiktok", "googleAds"];

export async function POST(request: NextRequest) {
    const guard = requireAdmin(request);
    if (guard.response) return guard.response;

    const body = await request.json().catch(() => ({}));
    const platform = body.platform as CompanyPlatformId | undefined;

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
        return NextResponse.json({ error: "platform ไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        const companyId = await getSelectedCompanyId(request);
        const company = await getCompanyById(companyId);

        if (!company) {
            return NextResponse.json({ error: "ไม่พบบริษัท" }, { status: 404 });
        }

        // Today (provisional numbers) refreshes the "right now" picture; yesterday is
        // re-pulled too since late attribution can still shift it after the nightly cron ran.
        const results = await runManualEtlSync(company, platform, [getYesterdayInBangkok(), getTodayInBangkok()]);

        const failed = results.find((r) => r.status === "failed");
        if (failed) {
            return NextResponse.json({ error: failed.error ?? "ซิงค์ไม่สำเร็จ", results }, { status: 502 });
        }

        return NextResponse.json({ results, syncedAt: new Date().toISOString() });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "ซิงค์ไม่สำเร็จ" }, { status: 500 });
    }
}
