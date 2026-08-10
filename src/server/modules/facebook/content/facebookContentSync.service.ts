import { config } from "@/server/configurations/config";
import { getFacebookPagePosts } from "../facebookEtl.repository";
import { normalizeFacebookPagePost } from "./facebookContent.adapter";
import { saveContentImportResult } from "@/server/core/content-import/content-import-database.service";
import type { NormalizedContentImportResult } from "@/server/core/content-import/content-import.types";

const REQUIRED_PAGE_SCOPES = ["pages_read_engagement"] as const;

function isFacebookPageTokenPermissionError(message: string): boolean {
    return /pages_read_engagement|pages_read_user_content|Page Public Content Access/i.test(message);
}

async function getDebugTokenInfo(providedToken: string) {
    const base = `${config.facebook.baseUrl}/${config.facebook.apiVersion}`;
    const appToken = `${config.facebook.appId}|${config.facebook.appSecret}`;
    const debugUrl = new URL(`${base}/debug_token`);
    debugUrl.searchParams.set("input_token", providedToken);
    debugUrl.searchParams.set("access_token", appToken);

    const debugResp = await fetch(debugUrl.toString(), { cache: "no-store" });
    if (!debugResp.ok) {
        const message = await debugResp.text();
        throw new Error(message || "Unable to debug provided Facebook token.");
    }

    const debugBody = await debugResp.json();
    const scopes = debugBody?.data?.scopes ?? debugBody?.data?.scope ?? [];
    const scopeList = Array.isArray(scopes) ? scopes : String(scopes).split(',').map((s: string) => s.trim());
    const granularScopes: Array<{ scope: string; target_ids?: string[] }> = debugBody?.data?.granular_scopes ?? [];

    return {
        isValid: debugBody?.data?.is_valid ?? false,
        type: debugBody?.data?.type ?? null,
        appId: debugBody?.data?.app_id ?? null,
        userId: debugBody?.data?.user_id ?? null,
        scopes: scopeList,
        granularScopes,
    };
}

/**
 * A scope name can appear in the flat `scopes` list while still being rejected
 * by Facebook (#10) if it isn't bound to this specific page in `granular_scopes`.
 * Returns false only when a granular entry for this scope exists AND excludes
 * the page -- if Facebook didn't return granular_scopes at all for this token,
 * we fall back to trusting the flat scope check (older token shape).
 */
function isScopeGrantedForPage(
    granularScopes: Array<{ scope: string; target_ids?: string[] }>,
    scopeName: string,
    pageId: string,
): boolean {
    const entry = granularScopes.find((g) => g.scope === scopeName);
    if (!entry) return true;
    return Array.isArray(entry.target_ids) && entry.target_ids.includes(pageId);
}

async function validatePageToken(pageId: string, pageToken: string): Promise<void> {
    const base = `${config.facebook.baseUrl}/${config.facebook.apiVersion}`;

    const meUrl = new URL(`${base}/me`);
    meUrl.searchParams.set("access_token", pageToken);
    meUrl.searchParams.set("fields", "id");
    const meResp = await fetch(meUrl.toString(), { cache: "no-store" });
    if (!meResp.ok) throw new Error("Provided token is not a valid Page access token.");

    const meBody = await meResp.json();
    if (!meBody?.id || String(meBody.id) !== String(pageId)) {
        throw new Error("Provided token is not scoped to the configured Facebook page.");
    }

    const permCheckUrl = new URL(`${base}/${pageId}/posts`);
    permCheckUrl.searchParams.set("access_token", pageToken);
    permCheckUrl.searchParams.set("limit", "1");

    // TEMP DIAGNOSTIC (facebook-content-sync-debug skill) -- remove after root cause confirmed.
    const debugUrl = new URL(permCheckUrl);
    debugUrl.searchParams.delete("access_token");
    console.log("[fb-content-sync] permission pre-check request", {
        url: debugUrl.toString(),
        tokenPrefix: pageToken?.slice(0, 10),
        tokenLength: pageToken?.length,
    });

    const permCheckResp = await fetch(permCheckUrl.toString(), { cache: "no-store" });
    if (!permCheckResp.ok) {
        const message = await permCheckResp.text();
        console.log("[fb-content-sync] permission pre-check FAILED", {
            status: permCheckResp.status,
            body: message,
        });
        throw new Error(message || "Unable to read page posts with the provided Page access token.");
    }
}

async function resolvePageAccessTokenForPage(pageId: string, providedToken: string): Promise<string> {
    const base = `${config.facebook.baseUrl}/${config.facebook.apiVersion}`;

    // First inspect the provided token
    let debugInfo;
    try {
        debugInfo = await getDebugTokenInfo(providedToken);
    } catch {
        debugInfo = null;
    }

    // TEMP DIAGNOSTIC (facebook-content-sync-debug skill) -- remove after root cause confirmed.
    console.log("[fb-content-sync] runtime token check", {
        pageId,
        tokenPrefix: providedToken?.slice(0, 10),
        tokenLength: providedToken?.length,
        debugType: debugInfo?.type ?? null,
        debugScopes: debugInfo?.scopes ?? null,
        debugAppId: debugInfo?.appId ?? null,
        debugUserId: debugInfo?.userId ?? null,
        pagesReadEngagementGranularEntry: debugInfo?.granularScopes.find((g) => g.scope === "pages_read_engagement") ?? null,
    });

    if (debugInfo?.type === "PAGE") {
        const missing = REQUIRED_PAGE_SCOPES.filter((scope) => !debugInfo.scopes.includes(scope));
        if (missing.length > 0) {
            throw new Error(
                `Facebook Page token is missing required permission(s): ${missing.join(", ")}. ` +
                `GET /{page-id}/posts requires 'pages_read_engagement'. ` +
                `Re-authorize the token with this permission.`,
            );
        }

        const unboundScope = REQUIRED_PAGE_SCOPES.find((scope) => !isScopeGrantedForPage(debugInfo.granularScopes, scope, pageId));
        if (unboundScope) {
            throw new Error(
                `Facebook token has '${unboundScope}' in its scope list but did not bind it to page ${pageId} ` +
                `(granular_scopes.target_ids for this permission excludes this page). Re-authorize the token via Graph API ` +
                `Explorer/OAuth and explicitly select this page on the "Choose the Pages you want this app to access" step.`,
            );
        }

        await validatePageToken(pageId, providedToken);
        return providedToken;
    }

    if (debugInfo?.type === "USER") {
        const missing = REQUIRED_PAGE_SCOPES.filter((scope) => !debugInfo.scopes.includes(scope));
        if (missing.length > 0) {
            throw new Error(
                `Provided User access token is missing required permission(s): ${missing.join(", ")}. ` +
                `Request pages_read_engagement and pages_show_list when logging in.`,
            );
        }
    }

    // 2) If the provided token is a user token with the right permissions, /me/accounts
    // will include the page entry and its page access token.
    try {
        const accountsUrl = new URL(`${base}/me/accounts`);
        accountsUrl.searchParams.set("access_token", providedToken);
        accountsUrl.searchParams.set("fields", "id,access_token");
        const accountsResp = await fetch(accountsUrl.toString(), { cache: "no-store" });
        const accountsBody = await accountsResp.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageEntry = (accountsBody?.data ?? []).find((p: any) => String(p.id) === String(pageId));
        if (!pageEntry) {
            throw new Error('The provided token does not grant access to the configured Facebook page. Ensure the user has access to the page and that the app is installed for that page.');
        }

        if (!pageEntry.access_token) {
            throw new Error('User token is valid for the Page, but /me/accounts did not return a Page access token. Ensure the login requested pages_show_list and pages_read_engagement permissions and the app has access to the Page.');
        }

        await validatePageToken(pageId, pageEntry.access_token);
        return pageEntry.access_token;
    } catch (innerError) {
        if (innerError instanceof Error) throw innerError;
    }

    if (debugInfo?.scopes?.includes("pages_read_engagement")) {
        throw new Error('Token has pages_read_engagement but is not a valid Page-scoped token for the configured page. Use a User token to call /me/accounts and retrieve the Page access token for this page.');
    }

    throw new Error('Unable to resolve a Page-scoped access token for the configured FACEBOOK_PAGE_ID. Provide a Page access token (from /me/accounts) with pages_read_engagement.');
}

/**
 * Live alternative to the CSV import path: pulls the configured Page's posts
 * directly from the Graph API and upserts them into the same ContentPost/
 * ContentPostMetric tables, via the same saveContentImportResult used by CSV
 * import -- so the existing Content tab read path needs no changes.
 */
export async function syncFacebookContentFromApi(companyId: bigint) {
    if (!config.facebook.pageId || !config.facebook.pageAccessToken) {
        throw new Error("ยังไม่ได้ตั้งค่า FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN สำหรับซิงค์ Content จาก Facebook API");
    }

    try {
        const pageToken = await resolvePageAccessTokenForPage(config.facebook.pageId!, config.facebook.pageAccessToken!);

        const rows = await getFacebookPagePosts(config.facebook.pageId, pageToken);
        const posts = rows.map((row) => normalizeFacebookPagePost(row, config.facebook.pageId!));

        const result: NormalizedContentImportResult = {
            platformCode: "FACEBOOK",
            fileName: `Facebook API Sync ${new Date().toISOString()}`,
            rangeStartDate: null,
            rangeEndDate: null,
            posts,
        };

        return saveContentImportResult(result, result.fileName, companyId);
    } catch (error) {
        if (error instanceof Error && isFacebookPageTokenPermissionError(error.message)) {
            throw new Error(
                "Facebook Content Sync failed: FACEBOOK_PAGE_ACCESS_TOKEN ต้องเป็น Page-scoped token ที่มี permission " +
                "pages_read_engagement และถูกสร้างขึ้นสำหรับเพจเดียวกับ FACEBOOK_PAGE_ID. " +
                error.message,
            );
        }

        throw error;
    }
}
