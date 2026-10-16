import { config } from "@/server/configurations/config";
import { listCompanies } from "@/server/modules/company/company.repository";
import type { TokenHealth } from "@/types/tokenHealth";

// Facebook long-lived tokens have no refresh flow in this codebase (see facebookAuth.ts),
// so a token that silently expires stops the ETL. Warn this many days ahead.
export const TOKEN_WARNING_DAYS = 7;

interface DebugTokenResult {
    isValid: boolean;
    expiresAt: Date | null;
}

/** Asks Graph API about a token. `expires_at: 0` means the token never expires. */
async function debugToken(token: string): Promise<DebugTokenResult | null> {
    const url = new URL(`${config.facebook.baseUrl}/${config.facebook.apiVersion}/debug_token`);
    url.searchParams.set("input_token", token);
    url.searchParams.set("access_token", `${config.facebook.appId}|${config.facebook.appSecret}`);

    try {
        const response = await fetch(url.toString(), { cache: "no-store" });
        const body = await response.json();
        const data = body?.data;
        if (!response.ok || !data) return null;

        // Data access (90-day window) can lapse before the token itself does -- both stop reads.
        const expiries = [data.expires_at, data.data_access_expires_at].filter((v): v is number => typeof v === "number" && v > 0);
        return {
            isValid: Boolean(data.is_valid),
            expiresAt: expiries.length ? new Date(Math.min(...expiries) * 1000) : null,
        };
    } catch {
        return null;
    }
}

function evaluate(label: string, companyId: string | null, isValid: boolean | null, expiresAt: Date | null, now: Date): TokenHealth {
    const daysLeft = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / 86_400_000) : null;
    const base = { label, companyId, expiresAt: expiresAt?.toISOString() ?? null, daysLeft };

    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
        return { ...base, status: "expired", message: `${label}: token หมดอายุแล้ว — ต้องเชื่อมต่อใหม่` };
    }
    if (isValid === false) {
        return { ...base, status: "invalid", message: `${label}: token ใช้งานไม่ได้ (อาจถูกเพิกถอนหรือเปลี่ยนรหัสผ่าน) — ต้องเชื่อมต่อใหม่` };
    }
    if (daysLeft !== null && daysLeft <= TOKEN_WARNING_DAYS) {
        return { ...base, status: "expiring", message: `${label}: token จะหมดอายุในอีก ${daysLeft} วัน` };
    }
    if (isValid === null && !expiresAt) {
        return { ...base, status: "unknown", message: `${label}: ตรวจสอบ token ไม่ได้` };
    }
    return { ...base, status: "ok", message: `${label}: ปกติ` };
}

export async function getFacebookTokenHealth(now: Date = new Date()): Promise<TokenHealth[]> {
    const companies = (await listCompanies()).filter((company) => company.facebookAccessToken);

    const companyChecks = companies.map(async (company) => {
        const debug = await debugToken(company.facebookAccessToken!);
        // Fall back to the expiry stored at connect time when Graph API can't be reached.
        const expiresAt = debug ? debug.expiresAt : company.facebookTokenExpiresAt;
        return evaluate(`Facebook Ads (${company.name})`, company.id.toString(), debug?.isValid ?? null, expiresAt, now);
    });

    const pageCheck = config.facebook.pageAccessToken
        ? debugToken(config.facebook.pageAccessToken).then((debug) =>
              evaluate("Facebook Page (FACEBOOK_PAGE_ACCESS_TOKEN)", null, debug?.isValid ?? null, debug?.expiresAt ?? null, now),
          )
        : null;

    return Promise.all(pageCheck ? [...companyChecks, pageCheck] : companyChecks);
}

export function needsAttention(token: TokenHealth): boolean {
    return token.status === "expired" || token.status === "invalid" || token.status === "expiring";
}
