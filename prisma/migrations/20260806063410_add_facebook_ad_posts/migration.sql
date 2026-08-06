-- AlterTable
ALTER TABLE `ads` ADD COLUMN `post_id` BIGINT NULL;

-- CreateTable
CREATE TABLE `ad_posts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `platform_id` BIGINT NOT NULL,
    `external_post_id` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `permalink` TEXT NULL,
    `published_at` DATETIME(3) NULL,
    `like_count` INTEGER NULL,
    `comment_count` INTEGER NULL,
    `share_count` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ad_posts_company_id_platform_id_external_post_id_key`(`company_id`, `platform_id`, `external_post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ads_post_id_idx` ON `ads`(`post_id`);

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `ad_posts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_posts` ADD CONSTRAINT `ad_posts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_posts` ADD CONSTRAINT `ad_posts_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
