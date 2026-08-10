-- Which markets a product may be listed in. Mainland China and Hong Kong have
-- different import rules (see docs/market-hongkong.md), so the same catalogue cannot
-- be shown to both.
ALTER TABLE "products" ADD COLUMN "markets" TEXT[] NOT NULL DEFAULT ARRAY['CN']::TEXT[];

-- Everything sold so far was aimed at mainland China. Backfill explicitly rather than
-- relying on the column default, so rows created before this migration are unambiguous.
UPDATE "products" SET "markets" = ARRAY['CN']::TEXT[];

-- Listing pages always filter on this column.
CREATE INDEX "products_markets_idx" ON "products" USING GIN ("markets");
