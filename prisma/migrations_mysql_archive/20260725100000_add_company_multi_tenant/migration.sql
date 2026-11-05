-- CreateTable
CREATE TABLE `companies` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `facebook_ad_account_id` VARCHAR(191) NULL,
    `facebook_access_token` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the two companies. Real Facebook credentials are populated separately
-- by `npm run seed:companies` (reads from env, like seed-admin.js does for
-- the admin account) so secrets never live in migration history.
INSERT INTO `companies` (`name`, `code`, `updated_at`) VALUES
    ('รังสิโย', 'rungsiyo', CURRENT_TIMESTAMP(3)),
    ('บริษัทที่ 2', 'company-2', CURRENT_TIMESTAMP(3));

-- AlterTable: add company_id as nullable first so existing rows can be backfilled
ALTER TABLE `campaigns` ADD COLUMN `company_id` BIGINT NULL;
ALTER TABLE `import_jobs` ADD COLUMN `company_id` BIGINT NULL;
ALTER TABLE `content_import_jobs` ADD COLUMN `company_id` BIGINT NULL;
ALTER TABLE `content_posts` ADD COLUMN `company_id` BIGINT NULL;

-- Backfill: all data imported before multi-company support belongs to the
-- first company (Rungsiyo).
UPDATE `campaigns` SET `company_id` = (SELECT `id` FROM `companies` WHERE `code` = 'rungsiyo');
UPDATE `import_jobs` SET `company_id` = (SELECT `id` FROM `companies` WHERE `code` = 'rungsiyo');
UPDATE `content_import_jobs` SET `company_id` = (SELECT `id` FROM `companies` WHERE `code` = 'rungsiyo');
UPDATE `content_posts` SET `company_id` = (SELECT `id` FROM `companies` WHERE `code` = 'rungsiyo');

-- AlterTable: now that every row has a value, enforce NOT NULL
ALTER TABLE `campaigns` MODIFY COLUMN `company_id` BIGINT NOT NULL;
ALTER TABLE `import_jobs` MODIFY COLUMN `company_id` BIGINT NOT NULL;
ALTER TABLE `content_import_jobs` MODIFY COLUMN `company_id` BIGINT NOT NULL;
ALTER TABLE `content_posts` MODIFY COLUMN `company_id` BIGINT NOT NULL;

-- Add supporting indexes for the existing platform_id foreign keys before
-- dropping the composite unique indexes they were implicitly relying on.
CREATE INDEX `campaigns_platform_id_idx` ON `campaigns`(`platform_id`);
CREATE INDEX `content_posts_platform_id_idx` ON `content_posts`(`platform_id`);

-- Re-scope uniqueness to per-company: two companies may legitimately have a
-- campaign/post with the same external id from their own separate accounts.
ALTER TABLE `campaigns` DROP INDEX `campaigns_platform_id_external_campaign_id_key`;
ALTER TABLE `campaigns` ADD UNIQUE INDEX `campaigns_company_id_platform_id_external_campaign_id_key`(`company_id`, `platform_id`, `external_campaign_id`);

ALTER TABLE `content_posts` DROP INDEX `content_posts_platform_id_external_post_id_key`;
ALTER TABLE `content_posts` ADD UNIQUE INDEX `content_posts_company_id_platform_id_external_post_id_key`(`company_id`, `platform_id`, `external_post_id`);

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `import_jobs` ADD CONSTRAINT `import_jobs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `content_import_jobs` ADD CONSTRAINT `content_import_jobs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `content_posts` ADD CONSTRAINT `content_posts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
