-- Per-company TikTok App ID / Secret, so each company can use its own TikTok developer app.
-- When unset, the app falls back to the TIKTOK_APP_ID / TIKTOK_APP_SECRET env values.
ALTER TABLE "companies"
  ADD COLUMN "tiktok_app_id" TEXT,
  ADD COLUMN "tiktok_app_secret" TEXT;
