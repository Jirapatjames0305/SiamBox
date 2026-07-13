ALTER TABLE "settings" ALTER COLUMN "contact_wechat_id" SET DEFAULT 'admin_Siambox';
UPDATE "settings" SET "contact_wechat_id" = 'admin_Siambox' WHERE "contact_wechat_id" = 'admin_siambox';
