-- Admin-configurable payment method visibility. Default all on (current behaviour).
ALTER TABLE "settings" ADD COLUMN "pay_manual_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "pay_alipay_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "pay_wechat_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "pay_test_enabled" BOOLEAN NOT NULL DEFAULT true;
