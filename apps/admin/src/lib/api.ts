"use client";

import { getToken } from "./auth";
import type {
  Customer,
  CustomerNote,
  Order,
  Package,
  PartnerInquiry,
  PaymentMethodSetting,
  BestSeller,
  Product,
  ProductRequest,
  Review,
  Settings,
  Stats,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (Array.isArray(body?.issues) && body.issues.length > 0) {
        message = body.issues
          .map((i: { path?: (string | number)[]; message?: string }) =>
            `${(i.path ?? []).join(".") || "field"}: ${i.message ?? "invalid"}`)
          .join("; ");
      } else {
        message = body?.error ?? message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export async function pingAuth(): Promise<void> {
  await request("/api/admin/stats");
}

export async function fetchStats(): Promise<Stats> {
  const json = await request<{ data: Stats }>("/api/admin/stats");
  return json.data;
}

export async function fetchOrders(status?: string): Promise<Order[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const json = await request<{ data: Order[] }>(`/api/admin/orders${qs}`);
  return json.data;
}

export async function fetchOrder(orderNumber: string): Promise<Order> {
  const json = await request<{ data: Order }>(`/api/admin/orders/${orderNumber}`);
  return json.data;
}

export async function updateOrder(
  orderNumber: string,
  patch: { status?: string; internalNote?: string },
): Promise<Order> {
  const json = await request<{ data: Order }>(`/api/admin/orders/${orderNumber}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return json.data;
}

export async function approvePayment(paymentId: string, reference?: string) {
  return request(`/api/admin/payments/${paymentId}/approve`, {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
}

export async function rejectPayment(paymentId: string) {
  return request(`/api/admin/payments/${paymentId}/reject`, {
    method: "POST",
  });
}

export async function refundPayment(
  paymentId: string,
  input: { reason?: string; alsoRefundOrder?: boolean } = {},
) {
  return request(`/api/admin/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createShipment(
  orderNumber: string,
  input: { carrier: string; trackingNumber: string; weightGrams?: number },
) {
  return request(`/api/admin/orders/${orderNumber}/shipments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchProducts(): Promise<Product[]> {
  const json = await request<{ data: Product[] }>(`/api/admin/products`);
  return json.data;
}

export type ProductInput = {
  sku: string;
  slug: string;
  nameTh: string;
  nameZh?: string;
  nameEn?: string;
  descriptionTh?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  priceCents: number;
  currency?: string;
  stock?: number;
  weightGrams?: number;
  category?: string;
  tags?: string[];
  images?: string[];
  active?: boolean;
};

export async function createProduct(input: ProductInput): Promise<Product> {
  const json = await request<{ data: Product }>(`/api/admin/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return json.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const json = await request<{ data: Product }>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return json.data;
}

export async function fetchPackages(): Promise<Package[]> {
  const json = await request<{ data: Package[] }>(`/api/admin/packages`);
  return json.data;
}

export type PackageInput = {
  slug: string;
  nameTh: string;
  nameZh?: string | null;
  nameEn?: string | null;
  descriptionTh?: string | null;
  descriptionZh?: string | null;
  descriptionEn?: string | null;
  currency?: string;
  images?: string[];
  active?: boolean;
  items: { productId: string; quantity: number }[];
};

export async function createPackage(input: PackageInput): Promise<Package> {
  const json = await request<{ data: Package }>(`/api/admin/packages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return json.data;
}

export async function updatePackage(id: string, input: Partial<PackageInput>): Promise<Package> {
  const json = await request<{ data: Package }>(`/api/admin/packages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return json.data;
}

export async function deletePackage(id: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/packages/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok && res.status !== 204) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
}

export async function fetchCustomers(params?: { q?: string; status?: string }): Promise<Customer[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString() ? `?${qs}` : "";
  const json = await request<{ data: Customer[] }>(`/api/admin/customers${query}`);
  return json.data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const json = await request<{ data: Customer }>(`/api/admin/customers/${id}`);
  return json.data;
}

export async function updateCustomer(
  id: string,
  patch: { status?: "ACTIVE" | "BLACKLISTED"; name?: string },
): Promise<Customer> {
  const json = await request<{ data: Customer }>(`/api/admin/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return json.data;
}

export async function addCustomerNote(customerId: string, body: string): Promise<CustomerNote> {
  const json = await request<{ data: CustomerNote }>(`/api/admin/customers/${customerId}/notes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return json.data;
}

export async function deleteCustomerNote(customerId: string, noteId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin/customers/${customerId}/notes/${noteId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok && res.status !== 204) {
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }
}

export async function fetchSettings(): Promise<Settings> {
  const json = await request<{ data: Settings }>(`/api/admin/settings`);
  return json.data;
}

export async function updateSettings(input: Omit<Settings, "id" | "updatedAt">): Promise<Settings> {
  const json = await request<{ data: Settings }>(`/api/admin/settings`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return json.data;
}

export async function fetchPaymentMethods(): Promise<PaymentMethodSetting[]> {
  const json = await request<{ data: PaymentMethodSetting[] }>(`/api/admin/payment-methods`);
  return json.data;
}

export async function updatePaymentMethods(
  methods: PaymentMethodSetting[],
): Promise<PaymentMethodSetting[]> {
  const json = await request<{ data: PaymentMethodSetting[] }>(`/api/admin/payment-methods`, {
    method: "PUT",
    body: JSON.stringify({ methods }),
  });
  return json.data;
}

export async function fetchProductRequests(): Promise<ProductRequest[]> {
  const json = await request<{ data: ProductRequest[] }>(`/api/admin/product-requests`);
  return json.data;
}

export async function setProductRequestStatus(id: string, status: "NEW" | "DONE"): Promise<void> {
  await request(`/api/admin/product-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteProductRequest(id: string): Promise<void> {
  await request(`/api/admin/product-requests/${id}`, { method: "DELETE" });
}

export async function fetchPartnerInquiries(): Promise<PartnerInquiry[]> {
  const json = await request<{ data: PartnerInquiry[] }>(`/api/admin/partner-inquiries`);
  return json.data;
}

export async function setPartnerInquiryStatus(id: string, status: "NEW" | "CONTACTED"): Promise<void> {
  await request(`/api/admin/partner-inquiries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deletePartnerInquiry(id: string): Promise<void> {
  await request(`/api/admin/partner-inquiries/${id}`, { method: "DELETE" });
}

export async function fetchReviews(): Promise<Review[]> {
  const json = await request<{ data: Review[] }>(`/api/admin/reviews`);
  return json.data;
}

export async function setReviewStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
): Promise<void> {
  await request(`/api/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteReview(id: string): Promise<void> {
  await request(`/api/admin/reviews/${id}`, { method: "DELETE" });
}

export async function fetchBestSellers(): Promise<BestSeller[]> {
  const json = await request<{ data: BestSeller[] }>(`/api/admin/best-sellers`);
  return json.data;
}

export async function addBestSeller(productId: string): Promise<void> {
  await request(`/api/admin/best-sellers`, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeBestSeller(productId: string): Promise<void> {
  await request(`/api/admin/best-sellers/${productId}`, { method: "DELETE" });
}

export async function randomizeBestSellers(count = 6): Promise<BestSeller[]> {
  const json = await request<{ data: BestSeller[] }>(`/api/admin/best-sellers/randomize`, {
    method: "POST",
    body: JSON.stringify({ count }),
  });
  return json.data;
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/admin/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  const json = (await res.json()) as { data: { url: string } };
  return json.data;
}
