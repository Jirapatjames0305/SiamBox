import { z } from "zod";

// Hong Kong has no postal codes and no provinces — an address there is
// region (Hong Kong Island / Kowloon / New Territories) → district → street/building.
// Requiring province and postalCode made checkout impossible for HK customers, so both
// are optional at the schema level and the storefront enforces what each market needs.
export const shippingAddressSchema = z.object({
  recipient: z.string().min(1).max(100),
  phone: z.string().min(5).max(30),
  wechatId: z.string().max(100).optional(),
  /** Mainland: 省. Hong Kong: region — required there too, just labelled differently. */
  province: z.string().min(1).max(50),
  /** Mainland: 市. Hong Kong: district. */
  city: z.string().min(1).max(50),
  district: z.string().max(50).optional(),
  street: z.string().min(1).max(200),
  /** Mainland requires it; Hong Kong has no postcode system at all. */
  postalCode: z.string().max(20).optional(),
});
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const checkoutPackageItemSchema = z.object({
  kind: z.literal("package"),
  packageId: z.string().min(1),
  quantity: z.number().int().positive(),
  addons: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
});

export const checkoutCustomItemSchema = z.object({
  kind: z.literal("custom"),
  quantity: z.number().int().positive(),
  products: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const checkoutItemSchema = z.discriminatedUnion("kind", [
  checkoutPackageItemSchema,
  checkoutCustomItemSchema,
]);

// TEST routes through the active gateway on the PromptPay channel — every Thai provider
// supports it and it is the easiest channel to exercise in a sandbox. Testing only.
export const paymentMethodSchema = z.enum(["MANUAL", "ALIPAY", "WECHAT_PAY", "TEST"]);
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

// Which gateway the customer picked for an online payment. Only meaningful when the
// chosen channel runs in GATEWAY mode; ignored for manual bank transfer / QR + slip.
export const paymentProviderSchema = z.enum(["ksher", "opn", "2c2p"]);
export type PaymentProviderInput = z.infer<typeof paymentProviderSchema>;

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  customerNote: z.string().max(1000).optional(),
  paymentMethod: paymentMethodSchema.default("MANUAL"),
  // Omitted → the server falls back to the single provider named by PAYMENT_PROVIDER.
  paymentProvider: paymentProviderSchema.optional(),
  // Payment slip URL — uploaded by the customer for the manual bank-transfer flow.
  slipUrl: z.string().url().max(1000).optional(),
  shippingMethod: z.enum(["NORMAL", "EXPRESS"]).default("NORMAL"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
