-- Replace the Beam-specific payment reference with a provider-agnostic one, so Ksher,
-- Opn Payments and 2C2P can share the same Payment rows (preserves existing data).
ALTER TABLE "payments" RENAME COLUMN "beam_payment_link_id" TO "gateway_ref";
ALTER INDEX "payments_beam_payment_link_id_key" RENAME TO "payments_gateway_ref_key";
ALTER TABLE "payments" ADD COLUMN "gateway_provider" TEXT;

-- Rows created before this migration all came from Beam. Tagging them keeps the history
-- honest; the provider registry returns null for "beam", so refunds on those fall back to
-- the manual/offline path instead of calling an integration that no longer exists.
UPDATE "payments" SET "gateway_provider" = 'beam' WHERE "gateway_ref" IS NOT NULL;

-- BEAM was a gateway-testing checkout option; it has no equivalent under the new providers.
DELETE FROM "payment_method_settings" WHERE "method" = 'BEAM';
