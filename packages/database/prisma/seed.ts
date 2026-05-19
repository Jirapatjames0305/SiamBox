import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { sku: "SB-SNACK-001" },
    update: {},
    create: {
      sku: "SB-SNACK-001",
      slug: "thai-coconut-snack",
      nameTh: "ขนมมะพร้าวอบ",
      nameZh: "泰国椰子干",
      nameEn: "Thai Coconut Snack",
      priceCents: 1990,
      currency: "CNY",
      stock: 100,
      weightGrams: 80,
      category: "snack",
      tags: ["coconut", "snack"],
      images: [],
      active: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
