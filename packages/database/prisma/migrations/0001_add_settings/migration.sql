-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "sender_name" TEXT NOT NULL DEFAULT 'SiamBox',
    "sender_address_line_1" TEXT NOT NULL DEFAULT '',
    "sender_address_line_2" TEXT NOT NULL DEFAULT '',
    "sender_phone" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

