import { config } from "dotenv";
import path from "node:path";

// Load .env from workspace root, then fall back to local .env / inherited env
config({ path: path.resolve(__dirname, "../../../.env") });
config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import rateLimit from "express-rate-limit";
import { productsRouter } from "./routes/products.js";
import { packagesRouter } from "./routes/packages.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { productRequestsRouter } from "./routes/product-requests.js";
import { partnerInquiriesRouter } from "./routes/partner-inquiries.js";
import { reviewsRouter } from "./routes/reviews.js";
import { errorHandler } from "./middleware/error.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const PORT = Number(process.env.API_PORT ?? 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",");

// Render runs behind a proxy — trust it so rate limiting keys off the real client IP
app.set("trust proxy", 1);

// Global rate limit: backstop against bots hitting the API directly.
// 300/min/IP is generous on purpose — first-page bursts and mobile carrier NAT
// (many users sharing one IP) must never trip it; only abusive traffic does.
const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(globalLimiter);
// Capture the raw body so the Beam webhook can verify its HMAC signature.
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "siambox-api" });
});

// API docs
app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "SiamBox API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.use("/api/products", productsRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/product-requests", productRequestsRouter);
app.use("/api/partner-inquiries", partnerInquiriesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/webhooks", webhooksRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] docs at  http://localhost:${PORT}/swagger`);
});
