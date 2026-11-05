-- Per-company Google Ads OAuth client / developer token, so each company can use its
-- own Google Cloud project. When unset, the app falls back to the CLIENT_ID /
-- CLIENT_SECRET / DEVELOPER_TOKEN env values.
ALTER TABLE "companies"
  ADD COLUMN "google_ads_client_id" TEXT,
  ADD COLUMN "google_ads_client_secret" TEXT,
  ADD COLUMN "google_ads_developer_token" TEXT,
  ADD COLUMN "google_ads_login_customer_id" TEXT;
