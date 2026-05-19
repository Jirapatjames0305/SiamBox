export function formatPrice(cents: number, currency = "CNY"): string {
  const value = (cents / 100).toFixed(2);
  const symbol = currency === "CNY" ? "¥" : currency === "THB" ? "฿" : currency === "USD" ? "$" : currency;
  return `${symbol}${value}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PACKING",
  "SHIPPED",
  "IN_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL_TH: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระแล้ว",
  PACKING: "กำลังแพ็ค",
  SHIPPED: "ส่งออกแล้ว",
  IN_CUSTOMS: "ผ่านศุลกากร",
  OUT_FOR_DELIVERY: "กำลังจัดส่ง",
  DELIVERED: "ส่งถึงแล้ว",
  CANCELLED: "ยกเลิก",
  REFUNDED: "คืนเงิน",
};

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-100 text-amber-900";
    case "PAID":
      return "bg-blue-100 text-blue-900";
    case "PACKING":
      return "bg-indigo-100 text-indigo-900";
    case "SHIPPED":
    case "IN_CUSTOMS":
    case "OUT_FOR_DELIVERY":
      return "bg-cyan-100 text-cyan-900";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-900";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-neutral-200 text-neutral-700";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}
