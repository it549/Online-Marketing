-- CreateTable
CREATE TABLE `content_platforms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `content_platforms_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_import_jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `platform_id` BIGINT NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `range_start_date` DATE NULL,
    `range_end_date` DATE NULL,
    `total_records` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
    `error_message` TEXT NULL,
    `imported_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_posts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `platform_id` BIGINT NOT NULL,
    `external_post_id` VARCHAR(191) NOT NULL,
    `page_external_id` VARCHAR(191) NULL,
    `page_name` VARCHAR(191) NULL,
    `title` TEXT NULL,
    `post_type` VARCHAR(191) NULL,
    `permalink` TEXT NULL,
    `published_at` DATETIME(3) NULL,
    `duration_seconds` INTEGER NULL,
    `last_import_job_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `content_posts_platform_id_external_post_id_key`(`platform_id`, `external_post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_post_metrics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `post_id` BIGINT NOT NULL,
    `avg_seconds_viewed` DECIMAL(10, 3) NULL,
    `reach` INTEGER NULL,
    `impressions` INTEGER NULL,
    `reactions` INTEGER NULL,
    `comments` INTEGER NULL,
    `shares` INTEGER NULL,
    `saves` INTEGER NULL,
    `new_followers` INTEGER NULL,
    `viewers` INTEGER NULL,
    `views` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `content_post_metrics_post_id_key`(`post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `content_import_jobs` ADD CONSTRAINT `content_import_jobs_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `content_platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_posts` ADD CONSTRAINT `content_posts_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `content_platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_posts` ADD CONSTRAINT `content_posts_last_import_job_id_fkey` FOREIGN KEY (`last_import_job_id`) REFERENCES `content_import_jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_post_metrics` ADD CONSTRAINT `content_post_metrics_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `content_posts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
