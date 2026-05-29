-- Rename Omise payment columns to their ChillPay equivalents (preserves existing data).
ALTER TABLE "payments" RENAME COLUMN "omise_charge_id" TO "chillpay_transaction_id";
ALTER TABLE "payments" RENAME COLUMN "omise_source_id" TO "chillpay_token";
ALTER INDEX "payments_omise_charge_id_key" RENAME TO "payments_chillpay_transaction_id_key";
