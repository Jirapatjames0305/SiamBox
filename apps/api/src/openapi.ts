// OpenAPI 3.0 spec for SiamBox API.
// Served via swagger-ui-express at /api/docs.

const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "PACKING",
  "SHIPPED",
  "IN_CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const PAYMENT_STATUSES = ["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "REFUNDED"] as const;
const PAYMENT_METHODS = ["WECHAT", "ALIPAY", "BANK_TRANSFER", "OTHER"] as const;
const SHIPPING_CARRIERS = ["EMS", "DHL", "FEDEX", "OTHER"] as const;

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SiamBox API",
    description:
      "Thailand → China cross-border ecommerce backend.\n\n" +
      "Public endpoints expose the storefront product catalog and guest order tracking. " +
      "All `/api/admin/*` endpoints require an `Authorization: Bearer <ADMIN_TOKEN>` header.",
    version: "0.1.0",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health" },
    { name: "Products", description: "Public product catalog" },
    { name: "Orders", description: "Guest checkout and order tracking" },
    { name: "Admin · Stats" },
    { name: "Admin · Orders" },
    { name: "Admin · Payments" },
    { name: "Admin · Shipments" },
    { name: "Admin · Products" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Set to the value of the `ADMIN_TOKEN` env var.",
      },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          sku: { type: "string" },
          slug: { type: "string" },
          nameTh: { type: "string" },
          nameZh: { type: "string", nullable: true },
          nameEn: { type: "string", nullable: true },
          descriptionTh: { type: "string", nullable: true },
          descriptionZh: { type: "string", nullable: true },
          descriptionEn: { type: "string", nullable: true },
          priceCents: { type: "integer", example: 12900 },
          currency: { type: "string", example: "CNY" },
          stock: { type: "integer", example: 50 },
          weightGrams: { type: "integer", nullable: true, example: 250 },
          category: { type: "string", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          images: { type: "array", items: { type: "string", format: "uri" } },
          active: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductInput: {
        type: "object",
        required: ["sku", "slug", "nameTh", "priceCents"],
        properties: {
          sku: { type: "string", maxLength: 50 },
          slug: {
            type: "string",
            maxLength: 100,
            pattern: "^[a-z0-9-]+$",
            description: "lowercase letters, digits, dashes",
          },
          nameTh: { type: "string", maxLength: 200 },
          nameZh: { type: "string", maxLength: 200, nullable: true },
          nameEn: { type: "string", maxLength: 200, nullable: true },
          descriptionTh: { type: "string", maxLength: 5000, nullable: true },
          descriptionZh: { type: "string", maxLength: 5000, nullable: true },
          descriptionEn: { type: "string", maxLength: 5000, nullable: true },
          priceCents: { type: "integer", minimum: 0 },
          currency: { type: "string", minLength: 3, maxLength: 3, default: "CNY" },
          stock: { type: "integer", minimum: 0, default: 0 },
          weightGrams: { type: "integer", minimum: 1, nullable: true },
          category: { type: "string", maxLength: 50, nullable: true },
          tags: { type: "array", items: { type: "string" } },
          images: { type: "array", items: { type: "string", format: "uri" } },
          active: { type: "boolean", default: true },
        },
      },
      ShippingAddressInput: {
        type: "object",
        required: ["recipient", "phone", "province", "city", "street", "postalCode"],
        properties: {
          recipient: { type: "string", example: "李伟" },
          phone: { type: "string", example: "+8613800000000" },
          wechatId: { type: "string", nullable: true },
          province: { type: "string", example: "上海市" },
          city: { type: "string", example: "上海市" },
          district: { type: "string", nullable: true, example: "黄浦区" },
          street: { type: "string" },
          postalCode: { type: "string", example: "200000" },
        },
      },
      ShippingAddress: {
        allOf: [
          { $ref: "#/components/schemas/ShippingAddressInput" },
          {
            type: "object",
            properties: {
              id: { type: "string" },
              orderId: { type: "string" },
            },
          },
        ],
      },
      CheckoutInput: {
        type: "object",
        required: ["items", "shippingAddress"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
          shippingAddress: { $ref: "#/components/schemas/ShippingAddressInput" },
          customerNote: { type: "string", maxLength: 2000, nullable: true },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderId: { type: "string" },
          productId: { type: "string" },
          productNameTh: { type: "string" },
          productNameZh: { type: "string", nullable: true },
          quantity: { type: "integer" },
          unitPriceCents: { type: "integer" },
          totalCents: { type: "integer" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderId: { type: "string" },
          method: { type: "string", enum: PAYMENT_METHODS as unknown as string[] },
          status: { type: "string", enum: PAYMENT_STATUSES as unknown as string[] },
          amountCents: { type: "integer" },
          currency: { type: "string" },
          reference: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          approvedAt: { type: "string", format: "date-time", nullable: true },
          rejectedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      Shipment: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderId: { type: "string" },
          carrier: { type: "string", enum: SHIPPING_CARRIERS as unknown as string[] },
          trackingNumber: { type: "string" },
          weightGrams: { type: "integer", nullable: true },
          shippedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TrackingLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderId: { type: "string" },
          status: { type: "string" },
          location: { type: "string", nullable: true },
          message: { type: "string", nullable: true },
          occurredAt: { type: "string", format: "date-time" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string", example: "SB-MPBCNY6H-CULG" },
          status: { type: "string", enum: ORDER_STATUSES as unknown as string[] },
          subtotalCents: { type: "integer" },
          shippingCents: { type: "integer" },
          totalCents: { type: "integer" },
          currency: { type: "string" },
          customerNote: { type: "string", nullable: true },
          internalNote: { type: "string", nullable: true },
          placedAt: { type: "string", format: "date-time" },
          paidAt: { type: "string", format: "date-time", nullable: true },
          shippedAt: { type: "string", format: "date-time", nullable: true },
          deliveredAt: { type: "string", format: "date-time", nullable: true },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          shippingAddress: { $ref: "#/components/schemas/ShippingAddress", nullable: true },
          payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } },
          shipments: { type: "array", items: { $ref: "#/components/schemas/Shipment" } },
          trackingLogs: { type: "array", items: { $ref: "#/components/schemas/TrackingLog" } },
        },
      },
      Stats: {
        type: "object",
        properties: {
          ordersToday: { type: "integer" },
          pendingPayment: { type: "integer" },
          packing: { type: "integer" },
          shipped: { type: "integer" },
          delivered: { type: "integer" },
          revenueCents: { type: "integer" },
        },
      },
      UpdateOrderInput: {
        type: "object",
        properties: {
          status: { type: "string", enum: ORDER_STATUSES as unknown as string[] },
          internalNote: { type: "string", maxLength: 2000 },
        },
      },
      ApprovePaymentInput: {
        type: "object",
        properties: {
          reference: {
            type: "string",
            maxLength: 200,
            description: "External payment reference (WeChat trade no., bank txn, etc.)",
          },
        },
      },
      CreateShipmentInput: {
        type: "object",
        required: ["carrier", "trackingNumber"],
        properties: {
          carrier: { type: "string", enum: SHIPPING_CARRIERS as unknown as string[] },
          trackingNumber: { type: "string", minLength: 1, maxLength: 100 },
          weightGrams: { type: "integer", minimum: 1 },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "OrderNotFound" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "ValidationError" },
          issues: { type: "array", items: { type: "object" } },
        },
      },
      DataEnvelope: {
        type: "object",
        properties: {
          data: { type: "object" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    service: { type: "string", example: "siambox-api" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List active products",
        responses: {
          "200": {
            description: "Array of active products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/{slug}": {
      get: {
        tags: ["Products"],
        summary: "Get product by slug",
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Product",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/orders": {
      post: {
        tags: ["Orders"],
        summary: "Place a guest order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckoutInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Order" } },
                },
              },
            },
          },
          "400": {
            description: "Validation error or product not available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/orders/{orderNumber}": {
      get: {
        tags: ["Orders"],
        summary: "Get order by order number",
        parameters: [
          { name: "orderNumber", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Order with items, address, tracking logs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Order" } },
                },
              },
            },
          },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin · Stats"],
        summary: "Dashboard stats",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Stats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Stats" } },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/orders": {
      get: {
        tags: ["Admin · Orders"],
        summary: "List orders (optional status filter)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string", enum: ORDER_STATUSES as unknown as string[] },
          },
        ],
        responses: {
          "200": {
            description: "Up to 100 most recent orders",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Order" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/orders/{orderNumber}": {
      get: {
        tags: ["Admin · Orders"],
        summary: "Get full order detail (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderNumber", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Order with payments, shipments, tracking logs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Order" } },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Admin · Orders"],
        summary: "Update order status or internal note",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderNumber", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateOrderInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated order",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Order" } },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/payments/{id}/approve": {
      post: {
        tags: ["Admin · Payments"],
        summary: "Approve a payment (auto-promotes order to PAID)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApprovePaymentInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Approved payment",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Payment" } },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/payments/{id}/reject": {
      post: {
        tags: ["Admin · Payments"],
        summary: "Reject a payment",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Rejected payment",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Payment" } },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/orders/{orderNumber}/shipments": {
      post: {
        tags: ["Admin · Shipments"],
        summary: "Create a shipment (auto-promotes order to SHIPPED)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderNumber", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateShipmentInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created shipment",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Shipment" } },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Order not found" },
        },
      },
    },
    "/api/admin/products": {
      get: {
        tags: ["Admin · Products"],
        summary: "List all products (incl. inactive)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Admin · Products"],
        summary: "Create a product",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created product",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/admin/products/{id}": {
      patch: {
        tags: ["Admin · Products"],
        summary: "Update a product (partial)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated product",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};
