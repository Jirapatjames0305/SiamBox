-- Two shipping speeds: normal (shipping_base_cents) + express (shipping_express_cents).
ALTER TABLE "settings" ADD COLUMN "shipping_express_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "shipping_method" TEXT NOT NULL DEFAULT 'NORMAL';
