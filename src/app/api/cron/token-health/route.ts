import { NextRequest, NextResponse } from "next/server";
import { config } from "@/server/configurations/config";
import { requireCronSecret } from "@/server/core/auth/cron-guard";
import { getFacebookTokenHealth, needsAttention } from "@/server/modules/facebook/facebookTokenHealth.service";

// Daily cron (08:00 Asia/Bangkok / 01:00 UTC, called by an external scheduler with the CRON_SECRET bearer token). Posts to ALERT_WEBHOOK_URL when a token is expiring or dead.
// The payload carries both `text` (Slack / Google Chat) and `content` (Discord).
export async function GET(request: NextRequest) {
    const guard = requireCronSecret(request);
    if (guard.response) return guard.response;

    try {
        const tokens = await getFacebookTokenHealth();
        const alerts = tokens.filter(needsAttention);
        const webhookUrl = config.alerts.webhookUrl;

        let notified = false;
        if (alerts.length && webhookUrl) {
            const text = ["⚠️ Marketing Dashboard: token ใกล้หมดอายุ/ใช้งานไม่ได้", ...alerts.map((a) => `• ${a.message}`)].join("\n");
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, content: text }),
            });
            notified = response.ok;
        }

        return NextResponse.json({ checked: tokens.length, alerts, notified, webhookConfigured: Boolean(webhookUrl) });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Token health cron failed" },
            { status: 500 },
        );
    }
}
