-- Bank-transfer (manual payment) config shown to customers at checkout.
ALTER TABLE "settings" ADD COLUMN "bank_qr_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "settings" ADD COLUMN "bank_account_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "settings" ADD COLUMN "bank_account_number" TEXT NOT NULL DEFAULT '';
