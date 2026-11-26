-- Seller-entered unit cost per Shopee item_id ({"<item_id>": <baht>}), for COGS, net profit and Net ROAS.
ALTER TABLE "companies" ADD COLUMN "shopee_product_costs" JSONB;
