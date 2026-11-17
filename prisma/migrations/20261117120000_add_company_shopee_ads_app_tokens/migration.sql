-- Tokens from the second Shopee app (App Category "Ads Service"), which the shop authorizes separately.
-- Used only for /api/v2/ads calls; the main shopee_* tokens keep serving order/product/payment.
ALTER TABLE "companies"
  ADD COLUMN "shopee_ads_access_token" TEXT,
  ADD COLUMN "shopee_ads_refresh_token" TEXT,
  ADD COLUMN "shopee_ads_token_expires_at" TIMESTAMP(3);
