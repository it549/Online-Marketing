import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
    // Dev server is reached through a cloudflared quick tunnel (see .env SHOPEE_REDIRECT_URL)
    // so Shopee's OAuth callback has a public https URL. Next blocks cross-origin access to
    // dev resources (_next/*, HMR websocket) by default -- without this, pages hydrate with
    // broken JS over the tunnel and clicks (e.g. the login button) silently do nothing.
    // Update this host whenever the quick tunnel restarts and gets a new random subdomain.
    allowedDevOrigins: ["province-nathan-come-wood.trycloudflare.com"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
