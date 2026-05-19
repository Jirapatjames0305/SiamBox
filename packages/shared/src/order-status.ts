export const ORDER_STATUS_FLOW = [
  "PENDING_PAYMENT",
  "PAID",
  "PACKING",
  "SHIPPED",
  "IN_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OrderStatusFlow = (typeof ORDER_STATUS_FLOW)[number];

export const ORDER_STATUS_LABEL_TH: Record<OrderStatusFlow, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PACKING: "กำลังแพ็ค",
  SHIPPED: "ส่งออกแล้ว",
  IN_CUSTOMS: "ผ่านศุลกากร",
  OUT_FOR_DELIVERY: "กำลังจัดส่ง",
  DELIVERED: "ส่งถึงแล้ว",
};

export const ORDER_STATUS_LABEL_ZH: Record<OrderStatusFlow, string> = {
  PENDING_PAYMENT: "待付款",
  PAID: "已付款",
  PACKING: "打包中",
  SHIPPED: "已发货",
  IN_CUSTOMS: "清关中",
  OUT_FOR_DELIVERY: "派送中",
  DELIVERED: "已送达",
};
