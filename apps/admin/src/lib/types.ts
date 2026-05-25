export type OrderItem = {
  id: string;
  productId: string;
  productNameTh: string;
  productNameZh: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type ShippingAddress = {
  id: string;
  recipient: string;
  phone: string;
  wechatId: string | null;
  province: string;
  city: string;
  district: string | null;
  street: string;
  postalCode: string;
};

export type Payment = {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amountCents: number;
  currency: string;
  reference: string | null;
  slipUrl: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type Shipment = {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  weightGrams: number | null;
  shippedAt: string | null;
  createdAt: string;
};

export type TrackingLog = {
  id: string;
  status: string;
  location: string | null;
  message: string | null;
  occurredAt: string;
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
  internalNote: string | null;
  placedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  shippingAddress: ShippingAddress | null;
  payments: Payment[];
  shipments?: Shipment[];
  trackingLogs?: TrackingLog[];
};

export type PackageItem = {
  id: string;
  packageId: string;
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
  createdAt: string;
  updatedAt: string;
  items: PackageItem[];
};

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
  createdAt: string;
  updatedAt: string;
};

export type Stats = {
  ordersToday: number;
  pendingPayment: number;
  packing: number;
  shipped: number;
  delivered: number;
  revenueCents: number;
};

export type CustomerNote = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
};

export type Customer = {
  id: string;
  role: string;
  name: string | null;
  phone: string | null;
  wechatId: string | null;
  email: string | null;
  status: "ACTIVE" | "BLACKLISTED";
  createdAt: string;
  _count?: { orders: number };
  orders?: Order[];
  notes?: CustomerNote[];
  addresses?: ShippingAddress[];
};

export type Settings = {
  id: number;
  senderName: string;
  senderAddressLine1: string;
  senderAddressLine2: string;
  senderPhone: string;
  shippingBaseCents: number;
  customPackageMinCents: number;
  updatedAt: string;
};
