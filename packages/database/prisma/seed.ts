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
  {
    sku: "SB-SEAS-001",
    slug: "rosdee-green-curry-55g-3pcs",
    nameTh: "รสดี เมนู แกงเขียวหวาน 55 กรัม (แพ็ก 3 ซอง)",
    nameZh: "Rosdee 绿咖喱调味料 55克 (3包装)",
    nameEn: "Rosdee Menu Green Curry 55g (Pack of 3)",
    priceCents: 2800,
    stock: 50,
    weightGrams: 165,
    category: "seasoning",
    tags: ["rosdee", "curry", "green-curry"],
    images: ["https://placehold.co/600x600/4CAF50/ffffff?text=Green+Curry"],
  },
  {
    sku: "SB-SEAS-002",
    slug: "rosdee-sour-turmeric-soup-40g-3pcs",
    nameTh: "รสดี เมนู แกงส้ม 40 กรัม (แพ็ก 3 ซอง)",
    nameZh: "Rosdee 泰式酸姜黄汤调味料 40克 (3包装)",
    nameEn: "Rosdee Menu Thai Sour Turmeric Soup 40g (Pack of 3)",
    priceCents: 2500,
    stock: 50,
    weightGrams: 120,
    category: "seasoning",
    tags: ["rosdee", "soup", "kaeng-som"],
    images: ["https://placehold.co/600x600/FF9800/ffffff?text=Sour+Turmeric+Soup"],
  },
  {
    sku: "SB-SEAS-003",
    slug: "ajinomoto-five-spices-130g-2pcs",
    nameTh: "อายิโนะโมะโต๊ะ เครื่องพะโล้สำเร็จรูปชนิดผง 130 กรัม (แพ็ก 2 ซอง)",
    nameZh: "味之素 五香粉 130克 (2包装)",
    nameEn: "Ajinomoto Chinese Five Spices Blend Powder 130g (Pack of 2)",
    priceCents: 2200,
    stock: 40,
    weightGrams: 260,
    category: "seasoning",
    tags: ["ajinomoto", "spices", "palo"],
    images: ["https://placehold.co/600x600/795548/ffffff?text=Five+Spices"],
  },
  {
    sku: "SB-SEAS-004",
    slug: "rosdee-larb-namtok-30g-10pcs",
    nameTh: "รสดี เมนู ลาบ-น้ำตก 30 กรัม (แพ็ก 10 ซอง)",
    nameZh: "Rosdee 拉布-南托克调味料 30克 (10包装)",
    nameEn: "Rosdee Menu Larb-Namtok 30g (Pack of 10)",
    priceCents: 4800,
    stock: 30,
    weightGrams: 300,
    category: "seasoning",
    tags: ["rosdee", "larb", "namtok"],
    images: ["https://placehold.co/600x600/2E7D32/ffffff?text=Larb+Namtok"],
  },
  {
    sku: "SB-SEAS-005",
    slug: "rosdee-ka-prao-50g-10pcs",
    nameTh: "รสดี เมนู ผัดกะเพรา 50 กรัม (แพ็ก 10 ซอง)",
    nameZh: "Rosdee 罗勒炒调味料 50克 (10包装)",
    nameEn: "Rosdee Menu Ka Prao (Thai Basil Stir Fry) 50g (Pack of 10)",
    priceCents: 5500,
    stock: 30,
    weightGrams: 500,
    category: "seasoning",
    tags: ["rosdee", "ka-prao", "basil"],
    images: ["https://placehold.co/600x600/388E3C/ffffff?text=Ka+Prao"],
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
  {
    slug: "thai-seasoning-set",
    nameTh: "เซ็ตเครื่องปรุงไทยยอดนิยม",
    nameZh: "泰式调味料套装",
    nameEn: "Thai Seasoning Set",
    descriptionTh: "รวมเครื่องปรุงสำเร็จรูปยอดฮิต — แกงเขียวหวาน แกงส้ม และพะโล้ พร้อมทำอาหารไทยที่บ้าน",
    images: ["https://placehold.co/600x600/D97706/ffffff?text=Seasoning+Set"],
    items: [
      { sku: "SB-SEAS-001", quantity: 1 },
      { sku: "SB-SEAS-002", quantity: 1 },
      { sku: "SB-SEAS-003", quantity: 1 },
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
