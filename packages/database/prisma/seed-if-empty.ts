// Seeds only when the database has no products.
//
// The dev container runs this on every boot. Seeding unconditionally would be fine
// for a fresh database — the seed is upsert-based — but it would also inject demo
// rows into a database cloned from production (scripts/clone-prod-db.sh), which then
// no longer matches what it was cloned from. Checking first keeps both cases honest.
//
// CommonJS package (no "type": "module"), so: no top-level await, no import.meta.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.count();
  if (products > 0) {
    console.log(`[seed] ข้ามไป — มีสินค้าอยู่แล้ว ${products} รายการ`);
    return;
  }
  console.log("[seed] database ว่าง — กำลัง seed");
  execFileSync("tsx", [path.join(__dirname, "seed.ts")], { stdio: "inherit" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
