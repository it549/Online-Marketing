// In-memory limiter for failed logins. State lives per server instance, so on
// serverless/Workers it only slows a single instance down -- pair it with an edge
// rate-limit rule (e.g. Cloudflare) on /api/auth/login for a hard global limit.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_KEYS = 5000;

const failures = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
    return (failures.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
}

export function getLoginKeys(request: Request, email: string): { ipKey: string; emailKey: string } {
    const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    return { ipKey: `ip:${ip}`, emailKey: `email:${email.toLowerCase()}` };
}

/** Seconds until the caller may retry, or 0 when not limited. */
export function getRetryAfterSeconds(keys: string[], now = Date.now()): number {
    let retryAfterMs = 0;
    for (const key of keys) {
        const attempts = recent(key, now);
        if (attempts.length >= MAX_FAILURES) {
            retryAfterMs = Math.max(retryAfterMs, attempts[0] + WINDOW_MS - now);
        }
    }
    return Math.ceil(retryAfterMs / 1000);
}

export function recordLoginFailure(keys: string[], now = Date.now()): void {
    if (failures.size > MAX_TRACKED_KEYS) {
        for (const key of failures.keys()) {
            if (recent(key, now).length === 0) failures.delete(key);
        }
    }
    for (const key of keys) {
        failures.set(key, [...recent(key, now), now]);
    }
}

export function clearLoginFailures(keys: string[]): void {
    for (const key of keys) failures.delete(key);
}
