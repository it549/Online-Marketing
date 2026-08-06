import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/server/core/auth/cron-guard";
import { runDailyEtlSync } from "@/server/core/etl/etlOrchestrator.service";
import { getYesterdayInBangkok } from "@/server/core/etl/etlDate.util";

// Vercel Cron entry (see vercel.json): fires daily at 03:00 Asia/Bangkok, after
// "yesterday" has fully elapsed there. Supports manual backfill via ?date=YYYY-MM-DD
// and dry-run validation via ?dryRun=true (fetches+normalizes without persisting).
export async function GET(request: NextRequest) {
    const guard = requireCronSecret(request);
    if (guard.response) return guard.response;

    const dateParam = request.nextUrl.searchParams.get("date");
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
    const targetDate = dateParam ? new Date(dateParam) : getYesterdayInBangkok();

    try {
        const summary = await runDailyEtlSync(targetDate, { dryRun });
        return NextResponse.json(summary);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ETL ads-insights cron failed" },
            { status: 500 },
        );
    }
}
