CREATE TABLE "partner_inquiries" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT,
    "partner_type" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_inquiries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "partner_inquiries_status_idx" ON "partner_inquiries"("status");
