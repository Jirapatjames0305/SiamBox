-- Lets the admin choose which payment gateways appear at checkout, so the customer
-- can pick between Ksher / Opn Payments / 2C2P rather than being routed to a single
-- provider fixed in the environment.
CREATE TABLE "payment_provider_settings" (
    "provider" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "payment_provider_settings_pkey" PRIMARY KEY ("provider")
);

INSERT INTO "payment_provider_settings" ("provider") VALUES ('ksher'), ('opn'), ('2c2p');
