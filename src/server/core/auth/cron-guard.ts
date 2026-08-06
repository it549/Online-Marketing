import { NextRequest, NextResponse } from "next/server";
import { config } from "@/server/configurations/config";

export type CronGuardResult = { response?: undefined } | { response: NextResponse };

/**
 * Vercel attaches `Authorization: Bearer <CRON_SECRET>` automatically on
 * cron-triggered invocations once CRON_SECRET is set as an env var -- this
 * also lets the same routes be triggered manually (e.g. for backfill) by
 * passing the same header.
 */
export function requireCronSecret(request: NextRequest): CronGuardResult {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${config.cron.secret}`) {
        return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    return {};
}
