-- Adds Shopee Open API OAuth credentials to companies (mirrors the existing
-- facebook/tiktok credential columns). All nullable/additive, no data loss.
ALTER TABLE `companies`
    ADD COLUMN `shopee_shop_id` VARCHAR(191) NULL,
    ADD COLUMN `shopee_access_token` TEXT NULL,
    ADD COLUMN `shopee_refresh_token` TEXT NULL,
    ADD COLUMN `shopee_token_expires_at` DATETIME(3) NULL;
