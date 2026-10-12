import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/server/core/auth/cron-guard";
import { runDailyLeadSync } from "@/server/core/etl/etlOrchestrator.service";

const DEFAULT_LOOKBACK_MS = 60 * 60 * 1000; // hourly cron -- covers since the last run plus a small overlap

// Cron entry: call hourly from an external scheduler with the CRON_SECRET bearer token. Supports manual override
// via ?since=ISO-8601 and dry-run validation via ?dryRun=true.
export async function GET(request: NextRequest) {
    const guard = requireCronSecret(request);
    if (guard.response) return guard.response;

    const sinceParam = request.nextUrl.searchParams.get("since");
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - DEFAULT_LOOKBACK_MS);

    try {
        const summary = await runDailyLeadSync(sinceDate, { dryRun });
        return NextResponse.json(summary);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "ETL leads cron failed" },
            { status: 500 },
        );
    }
}
