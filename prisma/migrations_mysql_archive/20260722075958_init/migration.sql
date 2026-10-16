-- CreateTable
CREATE TABLE `platforms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `platforms_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `platform_id` BIGINT NOT NULL,
    `external_campaign_id` VARCHAR(191) NOT NULL,
    `campaign_name` VARCHAR(191) NOT NULL,
    `campaign_status` VARCHAR(191) NOT NULL,
    `ad_type` VARCHAR(191) NULL,
    `product_id` VARCHAR(191) NULL,
    `bid_strategy` VARCHAR(191) NULL,
    `placement` VARCHAR(191) NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `campaigns_platform_id_external_campaign_id_key`(`platform_id`, `external_campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_jobs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `platform_id` BIGINT NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `report_name` VARCHAR(191) NOT NULL,
    `report_start_date` DATE NOT NULL,
    `report_end_date` DATE NOT NULL,
    `total_records` INTEGER NOT NULL,
    `imported_by` BIGINT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
    `error_message` TEXT NULL,
    `imported_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_report_metrics` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT NOT NULL,
    `import_job_id` BIGINT NOT NULL,
    `report_start_date` DATE NOT NULL,
    `report_end_date` DATE NOT NULL,
    `impressions` INTEGER NULL,
    `clicks` INTEGER NULL,
    `ctr` DECIMAL(8, 4) NULL,
    `add_to_cart` INTEGER NULL,
    `add_to_cart_rate` DECIMAL(8, 4) NULL,
    `orders` INTEGER NULL,
    `direct_orders` INTEGER NULL,
    `conversion_rate` DECIMAL(8, 4) NULL,
    `direct_conversion_rate` DECIMAL(8, 4) NULL,
    `cost_per_order` DECIMAL(10, 2) NULL,
    `direct_cost_per_order` DECIMAL(10, 2) NULL,
    `units_sold` INTEGER NULL,
    `direct_units_sold` INTEGER NULL,
    `revenue` DECIMAL(12, 2) NULL,
    `directRevenue` DECIMAL(12, 2) NULL,
    `spend` DECIMAL(12, 2) NULL,
    `roas` DECIMAL(8, 2) NULL,
    `directRoas` DECIMAL(8, 2) NULL,
    `acos` DECIMAL(8, 2) NULL,
    `directAcos` DECIMAL(8, 2) NULL,
    `product_impressions` INTEGER NULL,
    `product_clicks` INTEGER NULL,
    `product_ctr` DECIMAL(8, 4) NULL,
    `voucher_amount` DECIMAL(12, 2) NULL,
    `voucher_sales` DECIMAL(12, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `import_jobs` ADD CONSTRAINT `import_jobs_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_report_metrics` ADD CONSTRAINT `campaign_report_metrics_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_report_metrics` ADD CONSTRAINT `campaign_report_metrics_import_job_id_fkey` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
