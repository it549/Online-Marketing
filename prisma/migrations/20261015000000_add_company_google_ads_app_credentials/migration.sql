-- Per-company Google Ads API app credentials (fall back to env when NULL).
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "google_ads_client_id" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "google_ads_client_secret" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "google_ads_developer_token" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "google_ads_login_customer_id" TEXT;
