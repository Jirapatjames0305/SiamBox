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
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter, UPLOADS_ROOT } from "./routes/admin.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { errorHandler } from "./middleware/error.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const PORT = Number(process.env.API_PORT ?? 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Serve uploaded files publicly (product images)
app.use("/uploads", express.static(UPLOADS_ROOT, { maxAge: "30d" }));

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
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/webhooks", webhooksRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] docs at  http://localhost:${PORT}/swagger`);
});
