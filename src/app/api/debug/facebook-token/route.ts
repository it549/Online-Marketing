import { NextRequest, NextResponse } from "next/server";
import { config } from "@/server/configurations/config";

export async function GET(_request: NextRequest) {
    try {
        const token = config.facebook.pageAccessToken;
        if (!token) return NextResponse.json({ success: false, message: "FACEBOOK_PAGE_ACCESS_TOKEN is not configured" }, { status: 400 });

        const base = `${config.facebook.baseUrl}/${config.facebook.apiVersion}`;

        // 1) /me -> true Page tokens return the page id as the subject
        try {
            const meUrl = new URL(`${base}/me`);
            meUrl.searchParams.set("access_token", token);
            const meResp = await fetch(meUrl.toString(), { cache: "no-store" });
            if (meResp.ok) {
                const meBody = await meResp.json();
                if (meBody?.id && String(meBody.id) === String(config.facebook.pageId)) {
                    return NextResponse.json({ success: true, tokenType: "page", pageIdMatches: true, message: "Configured token is a Page access token for the configured FACEBOOK_PAGE_ID" });
                }
            }
        } catch {
            // ignore
        }

        // 2) /me/accounts -> user token that can return a page token in the page entry
        try {
            const accountsUrl = new URL(`${base}/me/accounts`);
            accountsUrl.searchParams.set("access_token", token);
            accountsUrl.searchParams.set("fields", "id,access_token");
            const accountsResp = await fetch(accountsUrl.toString(), { cache: "no-store" });
            if (accountsResp.ok) {
                const accountsBody = await accountsResp.json();
                const pageEntry = (accountsBody?.data ?? []).find((p: any) => String(p.id) === String(config.facebook.pageId));
                if (pageEntry) {
                    return NextResponse.json({
                        success: true,
                        tokenType: "user",
                        pageIdMatches: true,
                        canResolvePageToken: !!pageEntry.access_token,
                        message: pageEntry.access_token
                            ? "Configured token is a User token. /me/accounts contains the Page entry (do not share the returned page access token)."
                            : "Configured token is a User token but the Page entry has no page access token.",
                    });
                }
            }
        } catch {
            // ignore
        }

        // 3) debug_token for scopes/validity info
        try {
            const appToken = `${config.facebook.appId}|${config.facebook.appSecret}`;
            const debugUrl = new URL(`${base}/debug_token`);
            debugUrl.searchParams.set("input_token", token);
            debugUrl.searchParams.set("access_token", appToken);

            const debugResp = await fetch(debugUrl.toString(), { cache: "no-store" });
            if (debugResp.ok) {
                const debugBody = await debugResp.json();
                const scopes = debugBody?.data?.scopes ?? debugBody?.data?.scope ?? [];
                const scopesList = Array.isArray(scopes) ? scopes : String(scopes).split(',').map((s: string) => s.trim());
                const hasPagesScope = scopesList.includes('pages_read_engagement');

                return NextResponse.json({
                    success: true,
                    tokenType: "unknown",
                    pageIdMatches: false,
                    hasPagesReadEngagement: hasPagesScope,
                    debug: { is_valid: debugBody?.data?.is_valid ?? null },
                    message: "Unable to confirm Page membership. Use a User token to call /me/accounts to obtain a Page access token for the page.",
                });
            }
        } catch {
            // fallthrough
        }

        return NextResponse.json({ success: false, message: "Unable to determine token type for the configured FACEBOOK_PAGE_ACCESS_TOKEN" }, { status: 422 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
