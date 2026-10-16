-- Track which platforms are relevant per company (Nilaphatra has no Shopee data,
-- for example), and add Google Ads credential columns alongside the existing
-- Facebook ones.
ALTER TABLE companies
  ADD COLUMN platforms JSON NULL,
  ADD COLUMN google_ads_customer_id VARCHAR(191) NULL,
  ADD COLUMN google_ads_refresh_token TEXT NULL;

UPDATE companies SET platforms = JSON_ARRAY('facebook', 'shopee', 'tiktok') WHERE code = 'rungsiyo';
UPDATE companies SET platforms = JSON_ARRAY('facebook', 'tiktok', 'googleAds') WHERE code = 'company-2';
