import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    sku: "SB-SNACK-001",
    slug: "thai-coconut-snack",
    nameTh: "ขนมมะพร้าวอบ",
    nameZh: "泰国椰子干",
    nameEn: "Thai Coconut Snack",
    priceCents: 1990,
    stock: 100,
    weightGrams: 80,
    category: "snack",
    tags: ["coconut", "snack"],
    images: ["https://placehold.co/600x600/8B4513/ffffff?text=Coconut+Snack"],
  },
  {
    sku: "SB-SNACK-002",
    slug: "dried-mango",
    nameTh: "มะม่วงอบแห้ง",
    nameZh: "泰国芒果干",
    nameEn: "Dried Mango",
    priceCents: 2590,
    stock: 120,
    weightGrams: 100,
    category: "snack",
    tags: ["mango", "dried-fruit"],
    images: ["https://placehold.co/600x600/FFA500/ffffff?text=Dried+Mango"],
  },
  {
    sku: "SB-SNACK-003",
    slug: "durian-chips",
    nameTh: "ทุเรียนทอดกรอบ",
    nameZh: "榴莲脆片",
    nameEn: "Durian Chips",
    priceCents: 3990,
    stock: 80,
    weightGrams: 100,
    category: "snack",
    tags: ["durian", "chips"],
    images: ["https://placehold.co/600x600/DAA520/ffffff?text=Durian+Chips"],
  },
  {
    sku: "SB-SNACK-004",
    slug: "roasted-cashew-nuts",
    nameTh: "เม็ดมะม่วงหิมพานต์อบ",
    nameZh: "烤腰果",
    nameEn: "Roasted Cashew Nuts",
    priceCents: 4590,
    stock: 60,
    weightGrams: 150,
    category: "snack",
    tags: ["cashew", "nuts"],
    images: ["https://placehold.co/600x600/C49A6C/ffffff?text=Cashew+Nuts"],
  },
  {
    sku: "SB-SAUCE-001",
    slug: "tom-yum-paste",
    nameTh: "น้ำพริกต้มยำ",
    nameZh: "冬阴功汤酱",
    nameEn: "Tom Yum Paste",
    priceCents: 1890,
    stock: 90,
    weightGrams: 227,
    category: "sauce",
    tags: ["tom-yum", "paste"],
    images: ["https://placehold.co/600x600/B22222/ffffff?text=Tom+Yum+Paste"],
  },
  {
    sku: "SB-SAUCE-002",
    slug: "red-curry-paste",
    nameTh: "น้ำพริกแกงเผ็ด",
    nameZh: "红咖喱酱",
    nameEn: "Red Curry Paste",
    priceCents: 1690,
    stock: 90,
    weightGrams: 220,
    category: "sauce",
    tags: ["curry", "paste"],
    images: ["https://placehold.co/600x600/8B0000/ffffff?text=Red+Curry"],
  },
  {
    sku: "SB-SAUCE-003",
    slug: "pad-thai-sauce",
    nameTh: "ซอสผัดไทย",
    nameZh: "泰式炒河粉酱",
    nameEn: "Pad Thai Sauce",
    priceCents: 1590,
    stock: 100,
    weightGrams: 250,
    category: "sauce",
    tags: ["pad-thai", "sauce"],
    images: ["https://placehold.co/600x600/CD853F/ffffff?text=Pad+Thai+Sauce"],
  },
  {
    sku: "SB-DRINK-001",
    slug: "thai-tea",
    nameTh: "ชาไทย",
    nameZh: "泰式奶茶",
    nameEn: "Thai Tea",
    priceCents: 2290,
    stock: 150,
    weightGrams: 200,
    category: "drink",
    tags: ["tea", "drink"],
    images: ["https://placehold.co/600x600/D2691E/ffffff?text=Thai+Tea"],
  },
  {
    sku: "SB-COOK-001",
    slug: "coconut-milk",
    nameTh: "กะทิกล่อง",
    nameZh: "椰奶",
    nameEn: "Coconut Milk",
    priceCents: 1290,
    stock: 200,
    weightGrams: 400,
    category: "cooking",
    tags: ["coconut", "milk"],
    images: ["https://placehold.co/600x600/F5F5DC/333333?text=Coconut+Milk"],
  },
  {
    sku: "SB-COOK-002",
    slug: "jasmine-rice",
    nameTh: "ข้าวหอมมะลิ",
    nameZh: "茉莉香米",
    nameEn: "Thai Jasmine Rice",
    priceCents: 5990,
    stock: 50,
    weightGrams: 1000,
    category: "cooking",
    tags: ["rice", "jasmine"],
    images: ["https://placehold.co/600x600/FFFAF0/333333?text=Jasmine+Rice"],
  },
];

const packages = [
  {
    slug: "welcome-thai-box",
    nameTh: "กล่องต้อนรับไทย",
    nameZh: "泰国欢迎礼盒",
    nameEn: "Welcome Thai Box",
    descriptionTh: "เซ็ตของกินขนมไทยยอดนิยม เหมาะสำหรับลองชิมครั้งแรก",
    images: ["https://placehold.co/600x600/F59E0B/ffffff?text=Welcome+Box"],
    items: [
      { sku: "SB-SNACK-001", quantity: 2 },
      { sku: "SB-SNACK-002", quantity: 1 },
      { sku: "SB-DRINK-001", quantity: 1 },
    ],
  },
  {
    slug: "thai-cooking-starter",
    nameTh: "เซ็ตเริ่มต้นทำอาหารไทย",
    nameZh: "泰式烹饪入门套装",
    nameEn: "Thai Cooking Starter",
    descriptionTh: "พื้นฐานเครื่องปรุงสำหรับทำอาหารไทยที่บ้าน",
    images: ["https://placehold.co/600x600/B22222/ffffff?text=Cooking+Starter"],
    items: [
      { sku: "SB-SAUCE-001", quantity: 1 },
      { sku: "SB-SAUCE-002", quantity: 1 },
      { sku: "SB-SAUCE-003", quantity: 1 },
      { sku: "SB-COOK-001", quantity: 2 },
    ],
  },
  {
    slug: "premium-snack-box",
    nameTh: "กล่องขนมพรีเมียม",
    nameZh: "高级零食礼盒",
    nameEn: "Premium Snack Box",
    descriptionTh: "ขนมไทยพรีเมียมคัดสรร เหมาะเป็นของฝาก",
    images: ["https://placehold.co/600x600/8B4513/ffffff?text=Premium+Snack"],
    items: [
      { sku: "SB-SNACK-002", quantity: 2 },
      { sku: "SB-SNACK-003", quantity: 2 },
      { sku: "SB-SNACK-004", quantity: 1 },
    ],
  },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { images: p.images },
      create: {
        ...p,
        currency: "CNY",
        active: true,
      },
    });
  }

  // Seed packages — resolve SKU to product id, compute priceCents from items, then upsert by slug
  for (const pkg of packages) {
    const skuToProduct = new Map<string, { id: string; priceCents: number }>();
    for (const it of pkg.items) {
      const prod = await prisma.product.findUnique({
        where: { sku: it.sku },
        select: { id: true, priceCents: true },
      });
      if (!prod) throw new Error(`Seed: product not found for sku ${it.sku}`);
      skuToProduct.set(it.sku, prod);
    }
    const itemData = pkg.items.map((it) => ({
      productId: skuToProduct.get(it.sku)!.id,
      quantity: it.quantity,
    }));
    const priceCents = pkg.items.reduce(
      (sum, it) => sum + skuToProduct.get(it.sku)!.priceCents * it.quantity,
      0,
    );
    const existing = await prisma.package.findUnique({ where: { slug: pkg.slug } });
    if (existing) {
      await prisma.$transaction([
        prisma.packageItem.deleteMany({ where: { packageId: existing.id } }),
        prisma.package.update({
          where: { id: existing.id },
          data: {
            nameTh: pkg.nameTh,
            nameZh: pkg.nameZh,
            nameEn: pkg.nameEn,
            descriptionTh: pkg.descriptionTh,
            priceCents,
            images: pkg.images,
            items: { create: itemData },
          },
        }),
      ]);
    } else {
      await prisma.package.create({
        data: {
          slug: pkg.slug,
          nameTh: pkg.nameTh,
          nameZh: pkg.nameZh,
          nameEn: pkg.nameEn,
          descriptionTh: pkg.descriptionTh,
          priceCents,
          currency: "CNY",
          images: pkg.images,
          active: true,
          items: { create: itemData },
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
