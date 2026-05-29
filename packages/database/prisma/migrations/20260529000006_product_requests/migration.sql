CREATE TABLE "product_requests" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "detail" TEXT,
    "contact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_requests_status_idx" ON "product_requests"("status");
