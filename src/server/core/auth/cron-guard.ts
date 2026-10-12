import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { config } from "@/server/configurations/config";

export type CronGuardResult = { response?: undefined } | { response: NextResponse };

/**
 * Cron routes expect `Authorization: Bearer <CRON_SECRET>`. The scheduler that
 * calls them (and anyone triggering them manually, e.g. for backfill) must
 * send that header.
 */
export function requireCronSecret(request: NextRequest): CronGuardResult {
    const authHeader = request.headers.get("authorization");

    const expected = Buffer.from(`Bearer ${config.cron.secret}`);
    const received = Buffer.from(authHeader ?? "");

    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    return {};
}
