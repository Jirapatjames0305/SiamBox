-- Replace ChillPay payment columns with the Beam payment-link reference (preserves existing rows).
ALTER TABLE "payments" RENAME COLUMN "chillpay_transaction_id" TO "beam_payment_link_id";
ALTER TABLE "payments" DROP COLUMN "chillpay_token";
ALTER INDEX "payments_chillpay_transaction_id_key" RENAME TO "payments_beam_payment_link_id_key";
