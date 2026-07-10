-- AlterTable
ALTER TABLE "products" ADD COLUMN     "max_qty_per_order" INTEGER;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "purchase_limit_enabled" BOOLEAN NOT NULL DEFAULT true;
