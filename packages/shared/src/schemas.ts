import { z } from "zod";

export const shippingAddressSchema = z.object({
  recipient: z.string().min(1).max(100),
  phone: z.string().min(5).max(30),
  wechatId: z.string().max(100).optional(),
  province: z.string().min(1).max(50),
  city: z.string().min(1).max(50),
  district: z.string().max(50).optional(),
  street: z.string().min(1).max(200),
  postalCode: z.string().min(3).max(20),
});
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const paymentMethodSchema = z.enum(["MANUAL", "ALIPAY", "WECHAT_PAY"]);
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  customerNote: z.string().max(1000).optional(),
  paymentMethod: paymentMethodSchema.default("MANUAL"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
