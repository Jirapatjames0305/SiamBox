const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Product = {
  id: string;
  sku: string;
  slug: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  descriptionTh: string | null;
  descriptionZh: string | null;
  descriptionEn: string | null;
  priceCents: number;
  currency: string;
  stock: number;
  weightGrams: number | null;
  category: string | null;
  tags: string[];
  images: string[];
  active: boolean;
};

export type PackageItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type Package = {
  id: string;
  slug: string;
  nameTh: string;
  nameZh: string | null;
  nameEn: string | null;
  descriptionTh: string | null;
  descriptionZh: string | null;
  descriptionEn: string | null;
  priceCents: number;
  currency: string;
  images: string[];
  active: boolean;
  items: PackageItem[];
};

export type OrderItem = {
  id: string;
  productId: string;
  productNameTh: string;
  productNameZh: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  package?: {
    active: boolean;
    items: { quantity: number; product: { nameTh: string; nameZh: string | null } }[];
  } | null;
};

export type TrackingLog = {
  id: string;
  status: string;
  location: string | null;
  message: string | null;
  occurredAt: string;
};

export type Shipment = {
  id: string;
  carrier: string;
  trackingNumber: string;
  weightGrams: number | null;
  shippedAt: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  customerNote: string | null;
  placedAt: string;
  items: OrderItem[];
  shippingAddress: {
    recipient: string;
    phone: string;
    province: string;
    city: string;
    district: string | null;
    street: string;
    postalCode: string;
  } | null;
  trackingLogs: TrackingLog[];
  shipments: Shipment[];
  review: OrderReview | null;
};

export type OrderReview = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type Review = {
  id: string;
  authorName: string;
  location: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: init?.method && init.method !== "GET" ? "no-store" : init?.cache,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export async function listProducts(): Promise<Product[]> {
  const json = await request<{ data: Product[] }>("/api/products", {
    next: { revalidate: 30 },
  });
  return json.data;
}

export async function listBestSellers(): Promise<Product[]> {
  const json = await request<{ data: Product[] }>("/api/products/best-sellers", {
    next: { revalidate: 30 },
  });
  return json.data;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const json = await request<{ data: Product }>(`/api/products/${slug}`, {
      next: { revalidate: 30 },
    });
    return json.data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("API 404")) return null;
    throw err;
  }
}

export type PaymentMethodId = "MANUAL" | "ALIPAY" | "WECHAT_PAY" | "TEST";

export type PaymentMethodVisibility = { hidden: boolean; disabled: boolean };

export type BuildConfig = {
  customPackageMinCents: number;
  shippingBaseCents: number;
  shippingExpressCents: number;
  paymentMethods: Record<PaymentMethodId, PaymentMethodVisibility>;
  bankQrUrl: string;
  bankAccountName: string;
  bankAccountNumber: string;
  storeWechatId: string;
  alipayQrUrl: string;
  wechatQrUrl: string;
  alipayMode: "QR" | "GATEWAY";
  wechatMode: "QR" | "GATEWAY";
  heroBgUrl: string;
  storiesBgUrl: string;
  brandsBgUrl: string;
  partnerBgUrl: string;
  faviconUrl: string;
  logoUrl: string;
};

export async function getBuildConfig(): Promise<BuildConfig> {
  const json = await request<{ data: BuildConfig }>("/api/packages/config", {
    next: { revalidate: 30 },
  });
  return json.data;
}

export async function listPackages(): Promise<Package[]> {
  const json = await request<{ data: Package[] }>("/api/packages", {
    next: { revalidate: 30 },
  });
  return json.data;
}

export async function getPackageBySlug(slug: string): Promise<Package | null> {
  try {
    const json = await request<{ data: Package }>(`/api/packages/${slug}`, {
      next: { revalidate: 30 },
    });
    return json.data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("API 404")) return null;
    throw err;
  }
}

export type CheckoutItemPayload =
  | {
      kind: "package";
      packageId: string;
      quantity: number;
      addons?: { productId: string; quantity: number }[];
    }
  | {
      kind: "custom";
      quantity: number;
      products: { productId: string; quantity: number }[];
    };

export type CheckoutPayload = {
  items: CheckoutItemPayload[];
  shippingAddress: {
    recipient: string;
    phone: string;
    wechatId?: string;
    province: string;
    city: string;
    district?: string;
    street: string;
    postalCode: string;
  };
  customerNote?: string;
  paymentMethod?: "MANUAL" | "ALIPAY" | "WECHAT_PAY" | "TEST" | "BEAM";
  slipUrl?: string;
  shippingMethod?: "NORMAL" | "EXPRESS";
};

export type OrderWithAuth = Order & { authorizeUri: string | null };

export async function createOrder(payload: CheckoutPayload): Promise<OrderWithAuth> {
  const json = await request<{ data: OrderWithAuth }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json.data;
}

export async function uploadSlip(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/orders/slip`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Slip upload failed (${res.status})`);
  const json = (await res.json()) as { data: { url: string } };
  return json.data.url;
}

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  placedAt: string;
  items: { quantity: number; productNameTh: string; productNameZh: string | null }[];
};

export async function createProductRequest(
  payload: {
    productName: string;
    detail?: string;
    contact?: string;
    imageUrl?: string;
  },
): Promise<void> {
  await request("/api/product-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPartnerInquiry(
  payload: {
    companyName: string;
    contactName: string;
    contact: string;
    email?: string;
    partnerType?: string;
    message?: string;
  },
): Promise<void> {
  await request("/api/partner-inquiries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadProductRequestImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/product-requests/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const json = (await res.json()) as { data: { url: string } };
  return json.data.url;
}

export async function lookupOrders(phone: string): Promise<OrderSummary[]> {
  const json = await request<{ data: OrderSummary[] }>("/api/orders/lookup", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  return json.data;
}

export async function getOrder(orderNumber: string): Promise<Order | null> {
  try {
    const json = await request<{ data: Order }>(`/api/orders/${orderNumber}`, {
      cache: "no-store",
    });
    return json.data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("API 404")) return null;
    throw err;
  }
}

export async function listReviews(): Promise<Review[]> {
  const json = await request<{ data: Review[] }>("/api/reviews", {
    next: { revalidate: 60 },
  });
  return json.data;
}

export type OrderReviewState = {
  eligible: boolean;
  review: OrderReview | null;
  recipientName: string;
};

export async function getOrderReviewState(orderNumber: string): Promise<OrderReviewState | null> {
  try {
    const json = await request<{ data: OrderReviewState }>(`/api/reviews/order/${orderNumber}`, {
      cache: "no-store",
    });
    return json.data;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("API 404")) return null;
    throw err;
  }
}

export async function submitReview(
  orderNumber: string,
  payload: { authorName: string; rating: number; comment: string },
): Promise<void> {
  await request(`/api/reviews/order/${orderNumber}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
