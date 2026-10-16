-- AlterTable
ALTER TABLE `import_jobs` ADD COLUMN `source` ENUM('CSV', 'API') NOT NULL DEFAULT 'CSV';

-- CreateTable
CREATE TABLE `ad_sets` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `platform_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `external_adset_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ad_sets_campaign_id_idx`(`campaign_id`),
    UNIQUE INDEX `ad_sets_company_id_platform_id_external_adset_id_key`(`company_id`, `platform_id`, `external_adset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ads` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `platform_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `adset_id` BIGINT NOT NULL,
    `external_ad_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `creative_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ads_adset_id_idx`(`adset_id`),
    INDEX `ads_campaign_id_idx`(`campaign_id`),
    UNIQUE INDEX `ads_company_id_platform_id_external_ad_id_key`(`company_id`, `platform_id`, `external_ad_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_insights` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `platform_id` BIGINT NOT NULL,
    `import_job_id` BIGINT NULL,
    `entity_level` ENUM('CAMPAIGN', 'ADSET', 'AD') NOT NULL,
    `entity_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `date` DATE NOT NULL,
    `impressions` INTEGER NULL,
    `clicks` INTEGER NULL,
    `spend` DECIMAL(12, 2) NULL,
    `reach` INTEGER NULL,
    `frequency` DECIMAL(8, 4) NULL,
    `ctr` DECIMAL(8, 4) NULL,
    `cpc` DECIMAL(10, 4) NULL,
    `cpm` DECIMAL(10, 4) NULL,
    `conversions` DECIMAL(12, 2) NULL,
    `conversions_value` DECIMAL(12, 2) NULL,
    `raw` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ad_insights_campaign_id_date_idx`(`campaign_id`, `date`),
    INDEX `ad_insights_company_id_platform_id_date_idx`(`company_id`, `platform_id`, `date`),
    UNIQUE INDEX `ad_insights_company_id_platform_id_entity_level_entity_id_da_key`(`company_id`, `platform_id`, `entity_level`, `entity_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_insight_breakdowns` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `platform_id` BIGINT NOT NULL,
    `import_job_id` BIGINT NULL,
    `entity_level` ENUM('CAMPAIGN', 'ADSET', 'AD') NOT NULL,
    `entity_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NOT NULL,
    `date` DATE NOT NULL,
    `dimension_type` VARCHAR(191) NOT NULL,
    `dimension_value` VARCHAR(191) NOT NULL,
    `impressions` INTEGER NULL,
    `clicks` INTEGER NULL,
    `spend` DECIMAL(12, 2) NULL,
    `reach` INTEGER NULL,
    `conversions` DECIMAL(12, 2) NULL,
    `conversions_value` DECIMAL(12, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ad_insight_breakdowns_campaign_id_date_dimension_type_idx`(`campaign_id`, `date`, `dimension_type`),
    UNIQUE INDEX `ad_insight_breakdowns_company_id_platform_id_entity_level_en_key`(`company_id`, `platform_id`, `entity_level`, `entity_id`, `date`, `dimension_type`, `dimension_value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `company_id` BIGINT NOT NULL,
    `platform_id` BIGINT NOT NULL,
    `campaign_id` BIGINT NULL,
    `ad_id` BIGINT NULL,
    `import_job_id` BIGINT NULL,
    `source` VARCHAR(191) NOT NULL,
    `external_lead_id` VARCHAR(191) NOT NULL,
    `form_id` VARCHAR(191) NULL,
    `full_name` TEXT NULL,
    `email` TEXT NULL,
    `phone` TEXT NULL,
    `status` VARCHAR(191) NULL,
    `created_at_external` DATETIME(3) NULL,
    `raw` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `leads_company_id_campaign_id_idx`(`company_id`, `campaign_id`),
    INDEX `leads_created_at_external_idx`(`created_at_external`),
    UNIQUE INDEX `leads_company_id_platform_id_external_lead_id_key`(`company_id`, `platform_id`, `external_lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ad_sets` ADD CONSTRAINT `ad_sets_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_sets` ADD CONSTRAINT `ad_sets_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_sets` ADD CONSTRAINT `ad_sets_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_adset_id_fkey` FOREIGN KEY (`adset_id`) REFERENCES `ad_sets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insights` ADD CONSTRAINT `ad_insights_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insights` ADD CONSTRAINT `ad_insights_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insights` ADD CONSTRAINT `ad_insights_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insights` ADD CONSTRAINT `ad_insights_import_job_id_fkey` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insight_breakdowns` ADD CONSTRAINT `ad_insight_breakdowns_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insight_breakdowns` ADD CONSTRAINT `ad_insight_breakdowns_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insight_breakdowns` ADD CONSTRAINT `ad_insight_breakdowns_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_insight_breakdowns` ADD CONSTRAINT `ad_insight_breakdowns_import_job_id_fkey` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_platform_id_fkey` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_ad_id_fkey` FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_import_job_id_fkey` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
