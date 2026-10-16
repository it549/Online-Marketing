-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('CSV', 'API');

-- CreateEnum
CREATE TYPE "InsightEntityLevel" AS ENUM ('CAMPAIGN', 'ADSET', 'AD');

-- CreateTable
CREATE TABLE "companies" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "platforms" JSONB,
    "facebook_ad_account_id" TEXT,
    "facebook_access_token" TEXT,
    "facebook_token_expires_at" TIMESTAMP(3),
    "google_ads_customer_id" TEXT,
    "google_ads_refresh_token" TEXT,
    "tiktok_advertiser_id" TEXT,
    "tiktok_access_token" TEXT,
    "shopee_shop_id" TEXT,
    "shopee_access_token" TEXT,
    "shopee_refresh_token" TEXT,
    "shopee_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "external_campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "campaign_status" TEXT NOT NULL,
    "ad_type" TEXT,
    "product_id" TEXT,
    "bid_strategy" TEXT,
    "placement" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "filename" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "report_start_date" DATE NOT NULL,
    "report_end_date" DATE NOT NULL,
    "total_records" INTEGER NOT NULL,
    "imported_by" BIGINT,
    "status" "ImportStatus" NOT NULL,
    "source" "ImportSource" NOT NULL DEFAULT 'CSV',
    "error_message" TEXT,
    "imported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_report_metrics" (
    "id" BIGSERIAL NOT NULL,
    "campaign_id" BIGINT NOT NULL,
    "import_job_id" BIGINT NOT NULL,
    "report_start_date" DATE NOT NULL,
    "report_end_date" DATE NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "ctr" DECIMAL(8,4),
    "add_to_cart" INTEGER,
    "add_to_cart_rate" DECIMAL(8,4),
    "orders" INTEGER,
    "direct_orders" INTEGER,
    "conversion_rate" DECIMAL(8,4),
    "direct_conversion_rate" DECIMAL(8,4),
    "cost_per_order" DECIMAL(10,2),
    "direct_cost_per_order" DECIMAL(10,2),
    "units_sold" INTEGER,
    "direct_units_sold" INTEGER,
    "revenue" DECIMAL(12,2),
    "directRevenue" DECIMAL(12,2),
    "spend" DECIMAL(12,2),
    "roas" DECIMAL(8,2),
    "directRoas" DECIMAL(8,2),
    "acos" DECIMAL(8,2),
    "directAcos" DECIMAL(8,2),
    "product_impressions" INTEGER,
    "product_clicks" INTEGER,
    "product_ctr" DECIMAL(8,4),
    "voucher_amount" DECIMAL(12,2),
    "voucher_sales" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_report_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_sets" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "campaign_id" BIGINT NOT NULL,
    "external_adset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "campaign_id" BIGINT NOT NULL,
    "adset_id" BIGINT NOT NULL,
    "external_ad_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "creative_id" TEXT,
    "post_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_posts" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "external_post_id" TEXT NOT NULL,
    "message" TEXT,
    "permalink" TEXT,
    "published_at" TIMESTAMP(3),
    "like_count" INTEGER,
    "comment_count" INTEGER,
    "share_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_insights" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "import_job_id" BIGINT,
    "entity_level" "InsightEntityLevel" NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "campaign_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "spend" DECIMAL(12,2),
    "reach" INTEGER,
    "frequency" DECIMAL(8,4),
    "ctr" DECIMAL(8,4),
    "cpc" DECIMAL(10,4),
    "cpm" DECIMAL(10,4),
    "conversions" DECIMAL(12,2),
    "conversions_value" DECIMAL(12,2),
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_insight_breakdowns" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "import_job_id" BIGINT,
    "entity_level" "InsightEntityLevel" NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "campaign_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "dimension_type" TEXT NOT NULL,
    "dimension_value" TEXT NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "spend" DECIMAL(12,2),
    "reach" INTEGER,
    "conversions" DECIMAL(12,2),
    "conversions_value" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_insight_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "campaign_id" BIGINT,
    "ad_id" BIGINT,
    "import_job_id" BIGINT,
    "source" TEXT NOT NULL,
    "external_lead_id" TEXT NOT NULL,
    "form_id" TEXT,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "created_at_external" TIMESTAMP(3),
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_platforms" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_import_jobs" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "filename" TEXT NOT NULL,
    "range_start_date" DATE,
    "range_end_date" DATE,
    "total_records" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "error_message" TEXT,
    "imported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_posts" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "platform_id" BIGINT NOT NULL,
    "external_post_id" TEXT NOT NULL,
    "page_external_id" TEXT,
    "page_name" TEXT,
    "title" TEXT,
    "post_type" TEXT,
    "permalink" TEXT,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "last_import_job_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_post_metrics" (
    "id" BIGSERIAL NOT NULL,
    "post_id" BIGINT NOT NULL,
    "avg_seconds_viewed" DECIMAL(10,3),
    "reach" INTEGER,
    "impressions" INTEGER,
    "reactions" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "new_followers" INTEGER,
    "viewers" INTEGER,
    "views" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_post_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_code_key" ON "platforms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_company_id_platform_id_external_campaign_id_key" ON "campaigns"("company_id", "platform_id", "external_campaign_id");

-- CreateIndex
CREATE INDEX "ad_sets_campaign_id_idx" ON "ad_sets"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_sets_company_id_platform_id_external_adset_id_key" ON "ad_sets"("company_id", "platform_id", "external_adset_id");

-- CreateIndex
CREATE INDEX "ads_adset_id_idx" ON "ads"("adset_id");

-- CreateIndex
CREATE INDEX "ads_campaign_id_idx" ON "ads"("campaign_id");

-- CreateIndex
CREATE INDEX "ads_post_id_idx" ON "ads"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "ads_company_id_platform_id_external_ad_id_key" ON "ads"("company_id", "platform_id", "external_ad_id");

-- CreateIndex
CREATE UNIQUE INDEX "ad_posts_company_id_platform_id_external_post_id_key" ON "ad_posts"("company_id", "platform_id", "external_post_id");

-- CreateIndex
CREATE INDEX "ad_insights_campaign_id_date_idx" ON "ad_insights"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "ad_insights_company_id_platform_id_date_idx" ON "ad_insights"("company_id", "platform_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_insights_company_id_platform_id_entity_level_entity_id_d_key" ON "ad_insights"("company_id", "platform_id", "entity_level", "entity_id", "date");

-- CreateIndex
CREATE INDEX "ad_insight_breakdowns_campaign_id_date_dimension_type_idx" ON "ad_insight_breakdowns"("campaign_id", "date", "dimension_type");

-- CreateIndex
CREATE UNIQUE INDEX "ad_insight_breakdowns_company_id_platform_id_entity_level_e_key" ON "ad_insight_breakdowns"("company_id", "platform_id", "entity_level", "entity_id", "date", "dimension_type", "dimension_value");

-- CreateIndex
CREATE INDEX "leads_company_id_campaign_id_idx" ON "leads"("company_id", "campaign_id");

-- CreateIndex
CREATE INDEX "leads_created_at_external_idx" ON "leads"("created_at_external");

-- CreateIndex
CREATE UNIQUE INDEX "leads_company_id_platform_id_external_lead_id_key" ON "leads"("company_id", "platform_id", "external_lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_platforms_code_key" ON "content_platforms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "content_posts_company_id_platform_id_external_post_id_key" ON "content_posts"("company_id", "platform_id", "external_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_post_metrics_post_id_key" ON "content_post_metrics"("post_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_report_metrics" ADD CONSTRAINT "campaign_report_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_report_metrics" ADD CONSTRAINT "campaign_report_metrics_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_adset_id_fkey" FOREIGN KEY ("adset_id") REFERENCES "ad_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "ad_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_posts" ADD CONSTRAINT "ad_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_posts" ADD CONSTRAINT "ad_posts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insight_breakdowns" ADD CONSTRAINT "ad_insight_breakdowns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insight_breakdowns" ADD CONSTRAINT "ad_insight_breakdowns_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insight_breakdowns" ADD CONSTRAINT "ad_insight_breakdowns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_insight_breakdowns" ADD CONSTRAINT "ad_insight_breakdowns_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_import_jobs" ADD CONSTRAINT "content_import_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_import_jobs" ADD CONSTRAINT "content_import_jobs_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "content_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "content_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_last_import_job_id_fkey" FOREIGN KEY ("last_import_job_id") REFERENCES "content_import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_post_metrics" ADD CONSTRAINT "content_post_metrics_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "content_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

