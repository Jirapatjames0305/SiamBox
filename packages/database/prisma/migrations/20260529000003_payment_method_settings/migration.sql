-- Replace the interim per-method "enabled" flags with a dedicated visibility table
-- (hidden = not shown at all, disabled = shown greyed-out). DROP IF EXISTS so this
-- works whether or not 20260529000002 was applied.
ALTER TABLE "settings" DROP COLUMN IF EXISTS "pay_manual_enabled";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "pay_alipay_enabled";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "pay_wechat_enabled";
ALTER TABLE "settings" DROP COLUMN IF EXISTS "pay_test_enabled";

CREATE TABLE "payment_method_settings" (
    "method" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "payment_method_settings_pkey" PRIMARY KEY ("method")
);

INSERT INTO "payment_method_settings" ("method") VALUES
  ('MANUAL'), ('ALIPAY'), ('WECHAT_PAY'), ('TEST');
