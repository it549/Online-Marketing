/**
 * Builds an absolute URL for a server-issued redirect. Behind the cloudflared quick tunnel,
 * the Host header reaching Next.js is rewritten to the tunnel's own local origin
 * ("localhost:3001"), not the public domain, so `new URL(path, request.url)` would silently
 * build an unreachable "https://localhost:3001" URL for tunneled requests. But APP_PUBLIC_URL
 * can't be used unconditionally either: requests that hit the app directly on localhost carry
 * the same rewritten-looking Host, and forcing those onto APP_PUBLIC_URL would bounce a plain
 * localhost visitor out to the public tunnel domain. Cloudflare's edge stamps every request it
 * proxies with "cf-ray" (absent on direct localhost requests), so use that to tell tunneled
 * traffic apart from direct traffic and only rewrite the former.
 */
export function absoluteUrl(path: string, request: { url: string; headers: Headers }): URL {
    const isTunneled = request.headers.has("cf-ray");
    const base = isTunneled ? process.env.APP_PUBLIC_URL : undefined;
    return new URL(path, base || request.url);
}
