-- Rename the USDT payment method to CNY (หยวน). No rows use it, so a value rename is safe.
ALTER TYPE "PaymentMethod" RENAME VALUE 'USDT' TO 'CNY';
