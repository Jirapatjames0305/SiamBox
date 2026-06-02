-- CreateTable
CREATE TABLE "best_sellers" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "best_sellers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "best_sellers_product_id_key" ON "best_sellers"("product_id");

-- CreateIndex
CREATE INDEX "best_sellers_position_idx" ON "best_sellers"("position");

-- AddForeignKey
ALTER TABLE "best_sellers" ADD CONSTRAINT "best_sellers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
