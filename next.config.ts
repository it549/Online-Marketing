import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
    // Dev server is reached through a cloudflared quick tunnel (see .env SHOPEE_REDIRECT_URL)
    // so Shopee's OAuth callback has a public https URL. Next blocks cross-origin access to
    // dev resources (_next/*, HMR websocket) by default -- without this, pages hydrate with
    // broken JS over the tunnel and clicks (e.g. the login button) silently do nothing.
    // Update this host whenever the quick tunnel restarts and gets a new random subdomain.
    allowedDevOrigins: ["appmarketing.nexzafe.com"],
    experimental: {
        // Build defaults to (CPU count - 1) workers -- 15 on a 16-core box, ~2 GB spread over
        // 15 processes for a ~0.3s static-generation step. Two workers is plenty for this app.
        // (The overall build peak, ~3 GB, is Turbopack's compile step and is unaffected.)
        cpus: 2,
    },
};

export default nextConfig;

// Only needed by `next dev`; in build/start it would spawn an unused workerd + miniflare and waste RAM.
if (process.env.NODE_ENV === "development") {
    initOpenNextCloudflareForDev();
}
